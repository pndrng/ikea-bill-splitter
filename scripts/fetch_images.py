import json
import urllib.request
import re
import os
import time

def fetch_images():
    with open('data/invoice_items.json', 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    os.makedirs('public/images', exist_ok=True)
    
    for item in items:
        item_id = item['id']
        image_path = f"public/images/{item_id}.jpg"
        
        if os.path.exists(image_path):
            print(f"Image for {item_id} already exists. Skipping.")
            continue
            
        url = f'https://www.ikea.com/in/en/p/-{item_id}/'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req)
            html = response.read().decode('utf-8')
            images = re.findall(r'https://[^\s\"\'\>]*?images/products/[^\s\"\'\>]*?\.jpg', html)
            
            if images:
                # Filter for s5.jpg which are typically the main product images in good resolution
                s5_images = [img for img in images if 's5.jpg' in img]
                best_image = s5_images[0] if s5_images else images[0]
                
                print(f"Downloading {best_image} for item {item_id}")
                urllib.request.urlretrieve(best_image, image_path)
            else:
                print(f"No image found for item {item_id}")
                
        except Exception as e:
            print(f"Error fetching item {item_id}: {e}")
            
        time.sleep(0.5) # Be nice to the server

if __name__ == '__main__':
    fetch_images()
