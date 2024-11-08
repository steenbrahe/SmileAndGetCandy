#!/bin/bash
# TODO endpoint must be changed based on stack, so this file should be generated into the iotcerts folder, and perhaps rename to iot-dist
/bin/bash -c 'python3 dispenser.py --endpoint a3onq5vvtcyio0-ats.iot.us-east-2.amazonaws.com --ca_file Amazon-root-CA-1.pem --cert device.pem.crt --key privatekey.pem.key --client_id CandyDispenser --topic signage/smile-and-get-candy/screen/5'