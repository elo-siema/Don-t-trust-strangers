"""Pick server and start connection with VPNGate (http://www.vpngate.net/en/)"""

import requests, os, sys, tempfile, subprocess, base64, time, signal, psutil
import codecs
import ctypes
from random import randint
codecs.register(lambda name: codecs.lookup('utf-8') if name == 'cp65001' else None)

//this is a modified script by Andrea Lazzarotto, credits to him
__author__ = "Andrea Lazzarotto"
__copyright__ = "Copyright 2014+, Andrea Lazzarotto"
__license__ = "GPLv3"
__version__ = "1.0"
__maintainer__ = "Andrea Lazzarotto"
__email__ = "andrea.lazzarotto@gmail.com"

while True:
    try:
        vpn_data = requests.get('http://www.vpngate.net/api/iphone/').text.replace('\r','')
        servers = [line.split(',') for line in vpn_data.split('\n')]
        labels = servers[1]
        labels[0] = labels[0][1:]
        servers = [s for s in servers[2:] if len(s) > 1]
    except:
        print 'Cannot get VPN servers data'
        exit(1)


    supported = [s for s in servers if len(s[-1]) > 0]
    print str(len(supported)) + ' of these servers support OpenVPN'
    # We pick the best servers by score
    winner = sorted(supported, key=lambda s: s[2], reverse=True)[randint(0,len(supported)/4)]

    print "\n== Best server =="
    pairs = zip(labels, winner)[:-1]
    for (l, d) in pairs[:4]:
        print l + ': ' + d

    print pairs[4][0] + ': ' + str(float(pairs[4][1]) / 10**6) + ' MBps'
    print "Country: " + pairs[5][1]

    print "\nLaunching VPN..."
    _, path = tempfile.mkstemp()

    f = open(path, 'w')
    f.write(base64.b64decode(winner[-1]))

    f.close()

    x = subprocess.Popen(['openvpn',  '--config', path])

    time.sleep(40)
    try:
        print "\nLaunching node..."
        y = subprocess.Popen(['node',  '-r', 'epipebomb/register', 'E:\\6onode\\6onode.js'])
        print "\nLaunched node"

        while y.poll() != 0:
            #print "\npolling node"
            time.sleep(1)
        #y.kill()
        print "\n node dead"
    except:
        pass
    #del x

    print "\nkill VPN"
    # termination with Ctrl+C
    try:
        #x.stdin.write(0x73)
        #ctypes.windll.kernel32.TerminateProcess(int(x._handle), -1)
        for proc in psutil.process_iter():
            # check whether the process name matches
            if proc.name() == "openvpn.exe":
                proc.kill()
        del x
    except:
        pass

    time.sleep(10)
    print '\nVPN terminated'
