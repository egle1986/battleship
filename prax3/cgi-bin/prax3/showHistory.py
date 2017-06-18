#!/usr/bin/env python2
# -*- coding: utf-8 -*-
from __future__ import print_function
import sys
reload(sys)
sys.setdefaultencoding('UTF8')
import cgi
import json
import datetime

#järgmised kaks rida kuvavad erroreid, kui neid pruugib olla
import cgitb
cgitb.enable() 

history = []
try:
    f = open("history.json")
    history = json.loads(f.read())
    f.close()
except: 
    pass

form = cgi.FieldStorage()
key = form.getvalue("key", "start_time")
sort = int(form.getvalue("sort", "0"))
history = sorted(history, key = lambda h: h[key], reverse = sort)

if(sort == 0):
    sort = 1
else: 
    sort = 0
print("Content-Type: text/html")
print()

table = '<meta charset="utf-8">'
table = '<link href="../../prax3/styles/main.css" rel="stylesheet">';
table += '<table class="table" id="game-history">';
table += "<tr>";
table += "<th><a href='?key=start_time&sort={0}'>Algus</a></th>";
table += "<th><a href='?key=player1&sort={0}'>M2ngija 1</a></th>";
table += "<th><a href='?key=player2&sort={0}'>M2ngija 2</a></th>";
table += "<th><a href='?key=points1&sort={0}'>Punktid 1</a></th>";
table += "<th><a href='?key=points2&sort={0}'>Punktid 2</a></th>";
table += "<th><a href='?key=game_time&sort={0}'>Aeg (sek)</a></th>";
table += "</tr>";
table = table.format(str(sort))
for h in history:
    try:
        h["start_time"] = datetime.datetime.fromtimestamp(float(h["start_time"])).strftime("%Y-%m-%d %H:%M:%S")
    except Exception as err:
        pass
    table += "<tr>";
    table += "<td>" + str(h["start_time"]) + "</td>";
    table += "<td>" + str(h["player1"]) + "</td>";
    table += "<td>" + str(h["player2"]) + "</td>";
    table += "<td>" + str(h["points1"]) + "</td>";
    table += "<td>" + str(h["points2"]) + "</td>";
    try:
        table += "<td>" + str(int(float(h["game_time"]))) + "</td>";
    except Exception as err:
        pass
    table += "</tr>";
table += '</table>'
print(table)
