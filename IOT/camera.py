import command_line_utils as command_line_utils

from picamera import PiCamera
from time import sleep
import base64
import requests

cmdUtils = command_line_utils.CommandLineUtils("Take pictures and send to API Gateway")
cmdUtils.register_command("endpoint", "<endpoint>", "The DNS name of API gateway, with HTTPS://", True, str)
cmdUtils.register_command("screen_id", "<id>", "The id of the screen to with the camera is used", True, str)
# Needs to be called so the command utils parse the commands
cmdUtils.get_args()


if __name__ == '__main__':
    camera = PiCamera()

    # Set size
    camera.resolution = (1024, 768)
    camera.framerate = 15

    # Take picture // need to sleep for at least 2 sec to adjust to light
    camera.start_preview()

    i = 1
    while i<10000:
        sleep(5) 
        camera.capture('/home/admin/image.jpg')
        print('Picture taken, count: {}'.format(i))

        # Read image as base64 (rb is read binary)
        with open("/home/admin/image.jpg", "rb") as image2string:
            converted_string = base64.b64encode(image2string.read())

        # Send HTTP request
        url = "https://{}/screen/{}/detectuser".format(cmdUtils.get_command("dns"), cmdUtils.get_command("id"))
        request = {
            'image': converted_string
        }
        response = requests.post(url, json=request)
        print("Status code:", response.status_code)
        print("Response: ", response.text)
        i+=1
        

    camera.stop_preview()



