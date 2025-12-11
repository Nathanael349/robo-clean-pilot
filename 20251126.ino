/*
This is the code for the vacuum vehicle, ultrasonic sensor and wheel motor function have already included, vacuum motor function is needed
Date: 2025-11-28
Author: Keith Lim Zhi Wei, Sim Song Yi 
*/

// Define motor control pins for L298N Motor Driver
const int trig_pin2 = 13;
const int echo_pin2 = 11;
#define ENA 10  // Enable pin for Motor A (PWM speed control)
#define IN1 9  // Input 1 for Motor A (Direction control)
#define IN2 8  // Input 2 for Motor A (Direction control)
#define IN3 7  // Input 3 for Motor B (Direction control)
#define IN4 6  // Input 4 for Motor B (Direction control)
#define ENB 5 // Enable pin for Motor B (PWM speed control)
#define RELAY 4 // Input for Wheel Motor (Power control)
const int trig_pin1 = 3;
const int echo_pin1 = 2;


const int RED_DETECT_PIN = A2; // digital IN from color sensor or OpenMV (HIGH when red seen)
const int LED_PIN = A1;     // led output (digital)
const int SENSOR_INTERVAL = 100; // ms

// Navigation / speed
const int BASE_SPEED = 100;   // base forward speed (0..255)
const int MAX_SPEED = 220;    // limit for safety
// const int MIN_SPEED = 90; // minimum speed

// Wall-following target
const float RIGHT_DESIRED = 12.0; // cm - desired right distance
const float FRONT_THRESHOLD = 12.0; // cm - obstacle ahead
const float VACUUM_TRIGGER_DIST = 12.0; // cm - Distance to activate vacuum

// Red zone condition
const float RED_ZONE_DIST = 55.0; // cm threshold for "red zone" logic

// PID parameters (start values; tune later)
float Kp = 7;
float Ki = 0.2;
float Kd = 5;

// PID internals
float prevError = 0.0;
float integral = 0.0;
float derivFiltered = 0.0;
unsigned long lastPidTime = 0;
const float D_FILTER_ALPHA = 0.7; // derivative low-pass (0..1), higher -> more smoothing

bool vacuumState = false;
bool seeded = false;
unsigned long lastSensorRead = 0;
float distanceFront = 1000.0;
float distanceRight = 1000.0;

// Red Zone Logic State
bool seeingRed = false;
bool redZoneTriggered = false;
unsigned long redZoneTimer = 0;

bool targetDetected = false;     // True if 'K' received
unsigned long lastSignalTime = 0;
const int SIGNAL_TIMEOUT = 500;  // Reset 'K' status if not received for 500ms
static unsigned long vacuumResumeTime = 0;

// Manual Mode State
bool manualMode = false;
int manLeft = 0;
int manRight = 0;

// motor helper
void setMotor(int leftSpeed, int rightSpeed) {
  // left
  if (leftSpeed > 0) {
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, constrain(leftSpeed, 0, 255));
  } else if (leftSpeed < 0) {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    analogWrite(ENA, constrain(-leftSpeed, 0, 255));
  } else {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    analogWrite(ENA, 0);
  }

  // right
  if (rightSpeed > 0) {
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, constrain(rightSpeed, 0, 255));
  } else if (rightSpeed < 0) {
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, HIGH);
    analogWrite(ENB, constrain(-rightSpeed, 0, 255));
  } else {
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
    analogWrite(ENB, 0);
  }
}

void stopMotors() {
  setMotor(0,0);
}

// ultrasonic read (blocking but short timeout)
float readUltrasonicCm(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  unsigned long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout ~ 5m
  if (duration == 0) return 1000.0;
  float cm = (duration * 0.034) / 2.0;
  return cm;
}

// vacuum control (active LOW assumed)
void vacuum_on(){
  if (!vacuumState) {
    digitalWrite(RELAY, LOW);
    vacuumState = true;
  }
}
void vacuum_off(){
  if (vacuumState) {
    digitalWrite(RELAY, HIGH);
    vacuumState = false;
  }
}

void vacuum_init() {
  pinMode(RELAY, OUTPUT);    
  digitalWrite(RELAY, HIGH); 
  vacuumState = false;
}


void setup() {
  // Set all motor driver control pins as outputs
  pinMode(ENA, OUTPUT); // Left side wheel motor
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); // Right side wheel motor
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, HIGH);  // Input for relay ON at the setup
  pinMode(trig_pin1, OUTPUT);
  digitalWrite(trig_pin1, LOW);
  pinMode(echo_pin1, INPUT);
  pinMode(trig_pin2, OUTPUT);
  digitalWrite(trig_pin2, LOW);
  pinMode(echo_pin2, INPUT);
  pinMode(RED_DETECT_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.begin(115200);
  vacuum_init();
  lastPidTime = millis();
  lastSensorRead = millis();
  seeded = false;
}

// PID compute (returns correction to apply; positive -> steer left, negative -> steer right)
float computePID(float measured) {
  unsigned long now = millis();
  float dt = (now - lastPidTime) / 1000.0; // seconds
  if (dt <= 0.0) dt = 0.001;
  lastPidTime = now;

  float error = RIGHT_DESIRED - measured; // positive if too close to wall (we need steer left)
  integral += error * dt;

  // derivative (on error) with simple low-pass filter
  float rawDeriv = (error - prevError) / dt;
  derivFiltered = D_FILTER_ALPHA * derivFiltered + (1.0 - D_FILTER_ALPHA) * rawDeriv;

  float output = Kp * error + Ki * integral + Kd * derivFiltered;

  // anti-windup: if output about to saturate, back off integral a bit
  const float OUT_LIMIT = 100.0; // expected max adjust magnitude (tunable)
  if (output > OUT_LIMIT) {
    output = OUT_LIMIT;
    // reduce integral to prevent windup
    integral -= error * dt; 
  } else if (output < -OUT_LIMIT) {
    output = -OUT_LIMIT;
    integral -= error * dt;
  }

  prevError = error;
  return output;
}

void processSerialCommand() {
  if (Serial.available() > 0) {

    char c = Serial.peek(); 

    // If it's the target signal 'K'
    if (c == 'K') {
       Serial.read(); // consume it
       targetDetected = true;
       lastSignalTime = millis();
       // Optional: Debug
       // Serial.println("Target Detected (K)");
       return; 
    }

    String input = Serial.readStringUntil('\n');
    input.trim(); // remove whitespace

    if (input == "w") { manualMode = true; manLeft = BASE_SPEED; manRight = BASE_SPEED; }
    else if (input == "s") { manualMode = true; manLeft = -BASE_SPEED; manRight = -BASE_SPEED; }
    else if (input == "a") { manualMode = true; manLeft = -100; manRight = 100; }
    else if (input == "d") { manualMode = true; manLeft = 100; manRight = -100; }
    else if (input == "x") { manualMode = false; stopMotors(); }
    else if (input == "I") { vacuum_on(); }
    else if (input == "O") { vacuum_off(); }
  }
  // Timeout: If we haven't heard 'K' in 500ms, assume target lost
  if (millis() - lastSignalTime > SIGNAL_TIMEOUT) {
    targetDetected = false;
  }
}

void loop() {
  // seed random once
  if (!seeded) {
    randomSeed(micros());
    seeded = true;
  }
  processSerialCommand();

  // read sensors periodically
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = millis();
    distanceFront = readUltrasonicCm(trig_pin1, echo_pin1);
    distanceRight = readUltrasonicCm(trig_pin2, echo_pin2);
  }

  // MANUAL MODE CHECK
  if (manualMode) {
    setMotor(manLeft, manRight);
    return; // Skip all auto logic
  }

  // ------------------------------------------
  // LOGIC 1: Vacuum Activation (TARGET 'K')
  // ------------------------------------------
  // If Pi sends 'K' AND we are close (12cm)
  if (targetDetected && distanceFront < 60.0) {

    vacuumResumeTime = millis() + 6000;
  }
  if (millis() < vacuumResumeTime) {
    vacuum_off(); 
    digitalWrite(LED_PIN, HIGH); 
  } else {
      vacuum_on();
      digitalWrite(LED_PIN, LOW);
  }

  // ------------------------------------------
  // LOGIC 2: Obstacle Avoidance vs Approach
  // ------------------------------------------
  
  // CRITICAL CHANGE: Only evade front obstacle if we are NOT targeting
  // If targetDetected is TRUE, we allow the car to get closer than 25cm
  if (!targetDetected && distanceFront < FRONT_THRESHOLD) {
    // Stop first, prevent falling
    stopMotors();
    delay(200);
    // Evasive maneuver (Back up and turn)
    setMotor(-120, -120);
    delay(500);
    // if (distanceRight > RIGHT_DESIRED + 18.0) {
    //   setMotor(140, -100); // Pivot Right
    // } else {
    setMotor(-100, 150); // Pivot Left
    // }
    delay(500);
    return;
  }

  // ------------------------------------------
  // LOGIC 3: Wall Following / Navigation
  // ------------------------------------------
  
  if (distanceRight < 120.0) { 
    // Wall following logic
    float adjust = computePID(distanceRight); 
    float factor = 1.0; 
    int delta = (int)constrain(adjust * factor, -35, 35);
    
    // Simple smoothing
    // static float smoothDelta = 0;
    // smoothDelta = 0.3 * smoothDelta + 0.7 * delta; 
    // delta = smoothDelta; 

    int leftSpd = constrain(BASE_SPEED - delta, 0, MAX_SPEED);
    int rightSpd = constrain(BASE_SPEED + delta, 0, MAX_SPEED);

    setMotor(leftSpd, rightSpd);
  }
  else {
    // Open space logic
    setMotor(BASE_SPEED, BASE_SPEED);
    static unsigned long lastRand = 0;
    if (millis() - lastRand > 4000 + random(0,2000)) {
      int r = random(0,100);
      if (r < 70) { setMotor(BASE_SPEED + 10, BASE_SPEED - 25); } // Right arc
      else { setMotor(BASE_SPEED + 10 , BASE_SPEED + 10); } // Left arc
      delay(160);
      lastRand = millis();
    }
  }
}