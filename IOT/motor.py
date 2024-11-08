# This file contains code to rolate the 28BYJ step motor connected to a motor controller board UN?????
# https://github.com/gavinlyonsrepo/RpiMotorLib
# https://github.com/gavinlyonsrepo/RpiMotorLib/blob/master/Documentation/28BYJ.md
# To run A stepper motor connected to GPIO pins 18, 23, 24, 25 (18-IN1 23-IN2 24-IN3, 25-IN4) 
# for step delay of .01 second for 100-step control signal sequence, in clockwise direction, verbose output off , 
# in half step mode, with an init start delay of 50mS

import RPi.GPIO as GPIO
# import the library
from RpiMotorLib import RpiMotorLib

def rotate():
    print("Rotating motor")
    GpioPins = [18, 23, 24, 25]

    # Declare an named instance of class pass a name and motor type
    mymotortest = RpiMotorLib.BYJMotor("MyMotorOne", "28BYJ")

    # call the function , pass the parameters
    # half - recommended 0.001 512 full rotation. This mode works more smooth and faster
    # https://github.com/gavinlyonsrepo/RpiMotorLib/blob/master/Documentation/28BYJ.md
    mymotortest.motor_run(GpioPins , .001, 512, True, False, "half", .001)
    print("Moter completed rotating")
    # Full - recommended 0.01 s delay 512 for one rotation
    #mymotortest.motor_run(GpioPins , .01, 512, False, False, "full", .001)

    # Wawe
    #mymotortest.motor_run(GpioPins , .01, 512, False, False, "wave", .001)