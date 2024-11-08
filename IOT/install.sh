#
# Call this script from laptop on same network as raspberry pi.
# It will install and setup the candydispenser completely. 
# Prerequisite for running this script: "admin" user created at the pi with home directory /home/admin and sudo access
#

# Ask for ip addess
read -p "Enter Raspberry pi ipaddress [192.168.1.212]:" host
host=${host:-192.168.1.212} 
# Ask for raspberry pi userid
read -p "Enter Raspberry pi userid [admin]:" user
user=${user:-admin} 
# Ask for raspberry pi password
read -p "Enter Raspberry pi password [raspberry]:" password
password=${password:-raspberry} 

# Use SCP to transfer files
echo "Copying files to raspberry pi"
scp * $user@$host:./dispenser 

# Setup service by SSH to the device and execute these commands to 
echo $password | ssh -tt $user@$host << EOF
  echo "Installing motor lib"
  pip3 install rpimotorlib
  cd dispenser
  echo "Setting up auto start of dispenser"
  sudo cp candydispenser.service /lib/systemd/system
  sudo systemctl daemon-reload
  sudo systemctl enable candydispenser.service
  sudo systemctl start candydispenser.service
  # sudo systemctl status candydispenser.service
  echo "The dispenser had been started and will also be started att boot."
EOF

