import urllib.request
import re

url = 'https://www.ikea.com/in/en/p/-00162380/'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    images = re.findall(r'https://[^\s\"\'\>]*?images/products/[^\s\"\'\>]*?\.jpg', html)
    print('Redirected URL:', response.url)
    print('Images found:', list(set(images))[:3])
except Exception as e:
    print('Error:', e)
