#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from __future__ import print_function
import cgi
import json
from time import time

#järgmised kaks rida kuvavad erroreid, kui neid pruugib olla
import cgitb
cgitb.enable() 

keys = ["player1", "boardsize", "boatcount"]
form = cgi.FieldStorage()
d = {}
for key in keys: 
    d[key] = form.getvalue(key)

gameId = str(int(time)) + d["player1"]

