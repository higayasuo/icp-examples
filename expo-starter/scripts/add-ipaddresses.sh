sudo arp -a -d

sudo ifconfig en0 alias 192.168.0.210 netmask 255.255.255.0 broadcast 192.168.0.255
sudo ifconfig en0 alias 192.168.0.211 netmask 255.255.255.0 broadcast 192.168.0.255

arp -a | grep "192.168.0.211"
sudo arp -s 192.168.0.210 ba:5a:e9:f4:6e:59
sudo arp -s 192.168.0.211 ba:5a:e9:f4:6e:59
