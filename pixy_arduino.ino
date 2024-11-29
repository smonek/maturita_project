#include <SPI.h>
#include <Pixy.h>

// Initialize the Pixy camera
Pixy pixy;

void setup() {
  // Start Serial communication for output
  Serial.begin(9600);
  Serial.println("Initializing Pixy...");
  
  // Initialize Pixy
  pixy.init();
  Serial.println("Pixy initialized!");
}

void loop() {
  // Get the number of detected blocks
  int blockCount = pixy.getBlocks();

  // If blocks are detected
  if (blockCount > 0) {
    Serial.print("Detected ");
    Serial.print(blockCount);
    Serial.println(" blocks:");
    
    // Loop through all detected blocks
    for (int i = 0; i < blockCount; i++) {
      Serial.print("Block ");
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.print("Signature: ");
      Serial.print(pixy.blocks[i].signature);
      Serial.print(", X: ");
      Serial.print(pixy.blocks[i].x);
      Serial.print(", Y: ");
      Serial.print(pixy.blocks[i].y);
      Serial.print(", Width: ");
      Serial.print(pixy.blocks[i].width);
      Serial.print(", Height: ");
      Serial.println(pixy.blocks[i].height);
    }
  } else {
    Serial.println("No blocks detected.");
  }
  delay(1500); // Delay for readability
}
