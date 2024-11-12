import requests
import json
class Memory:

    def __init__(self):
        pass;


class DictMemory(Memory):
    def __init__(self):
        self.memory  = {}

    def add_item(self, key , value):
       self.memory[key] = value

    def get_item(self, key):
        return self.memory.get(key, None)

    def get_items(self):
        return self.memory


class GlobalServerMemory(Memory):
    def __init__(self, memory_address):
        self.memory_address = memory_address
    
    def add_item(self, key, value):
        r = requests.post(self.memory_address, data = json.dumps({
            'data' : {
                 "key" : key,
                 "value" : value,
              },
            'action' : 'store'
        }), 
        headers = {
            'Content-Type' : 'application/json'
        }
        )
        if r.status_code == 200:
            return r.json()
        return None


    def get_item(self, key):
        r = requests.post(
         data = json.dumps({
            'data' : {
                 "key" : key,
              },
            'action' : 'get'
        }), 
        headers = {
            'Content-Type' : 'application/json'
        } 
        )
        if r.status_code == 200:
            return r.json()
        return "{}"

    def get_items(self):
        r = requests.post(
         data = json.dumps({
            'action' : 'get'
        }), 
        headers = {
            'Content-Type' : 'application/json'
        } 
        )
        if r.status_code == 200:
            return r.json()
        return "{}"
