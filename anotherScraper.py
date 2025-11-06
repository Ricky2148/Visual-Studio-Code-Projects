import time
from selenium import webdriver
from selenium.webdriver import ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# --- Configuration ---
# Change this to the artist you want to track
artist_name = "Playboi Carti"
# ---------------------

options = ChromeOptions()
# Add --headless=new to run without opening a browser window
# options.add_argument("--headless=new") 
options.add_argument("--start-maximized")
options.add_experimental_option("excludeSwitches", ["enable-automation"])

s = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=s, options=options)

# 1. Go to the Ticketmaster homepage
url = "https://www.ticketmaster.com"
print(f"Navigating to: {url}")
driver.get(url)

concerts_list = []
seen_concerts = set() # To avoid duplicates

try:
    # 2. Find the search bar using its placeholder
    print(f"Searching for artist: {artist_name}...")
    search_bar = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'sc-a563e0a-13') and contains(@class, 'eYaMPd')]//input"))
    )
    
    # 3. Type the artist name
    search_bar.send_keys(artist_name)

    # 4. UPDATED: Wait for the search results dropdown and click the first item
    # This selector specifically targets the first list item by its ID,
    # which matches the HTML you provided.
    print("Waiting for search results dropdown...")
    first_result = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.XPATH, "//li[@id='search-suggest-0']"))
    )
    print("Clicking first result (id='search-suggest-0')...")
    first_result.click()

    # 5. Wait for the event list container to load on the artist's page
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.XPATH, "//ul[@data-testid='eventList']"))
    )
    print("Concert list loaded. Checking for 'Load More' button...")

    # 6. Scroll/Click "Load More" until all events are loaded
    # Ticketmaster uses a "Load More" button, not infinite scroll
    """while True:
        try:
            # Find the "Load More" button
            load_more_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@data-testid='load-more-events-button']"))
            )
            # Use a JavaScript click to avoid interception issues
            driver.execute_script("arguments[0].click();", load_more_button)
            print("Clicked 'Load More'...")
            # Wait for new events to render
            time.sleep(2) 
        except TimeoutException:
            # If the button isn't found, all events are loaded
            print("No more 'Load More' button found. All events loaded.")
            break
        except Exception as e:
            print(f"Error clicking 'Load More': {e}")
            break"""

    # 7. Find all event elements now that the page is fully loaded
    # We find the 'div' that contains one event's info
    events = driver.find_elements(By.XPATH, "//li[contains(@class, 'sc-fc65ccb2-1 bQMNgp')]")
    print(f"Found {len(events)} total event entries.")

    for event in events:
        try:
            # Extracting data from the new structure
            hidden_spans = event.find_elements(By.XPATH, ".//span[contains(@class, 'VisuallyHidden-sc-8buqks-0')]")
            data = [span.text for span in hidden_spans if span.text]
            
            # Date is split into Month and Day
            #date = event.find_element(By.XPATH, "//span[contains(@class, 'VisuallyHidden-sc-8buqks-0 lmhoCy')]").text
            
            #number = 90
            if "Promoted event" in data[0]:
                continue
            
            date = data[0]
            time_str = data[1]
            venue_and_title = data[3]
            
            """
            venue = event.find_element(By.XPATH, ".//span[contains(@class, 'event-info__venue-name')]").text
            location = event.find_element(By.XPATH, ".//span[contains(@class, 'event-info__venue-location')]").text
            
            # Get the ticket link and status ("See Tickets", "Sold Out", etc.)
            cta_button = event.find_element(By.XPATH, ".//a[@data-testid='event-list-item-cta-button']")
            status_text = cta_button.text
            ticket_link = cta_button.get_attribute('href')
            """

            # Use a tuple of data to check if we've seen this exact concert
            concert_id = (date, time_str, venue_and_title)
            if concert_id not in seen_concerts:
                seen_concerts.add(concert_id)
                concerts_list.append({
                    "date": date,
                    "time": time_str,
                    "venue and name": venue_and_title
                })
                
        except NoSuchElementException:
            # Skip if an event is structured differently (e.g., an ad)
            continue
        except Exception as e:
            print(f"Skipping an event, error occurred: {e}")
            continue

except TimeoutException:
    print(f"Could not find concert list for {artist_name}. They may have no upcoming shows or the search failed.")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    print("Scraping complete. Closing browser.")
    WebDriverWait(driver, 999)
    driver.quit()

# 8. Print the final collected data
if concerts_list:
    print("\n--- Final Concert List ---")
    for i in concerts_list:
        print(i)
    #for i, concert in enumerate(concerts_list, start=1):
        #print(f"{i}. Date:     {concert['date']}")
        #print(f"   Venue:    {concert['venue']}")
        #print(f"   Location: {concert['location']}")
        #print(f"   Status:   {concert['status']}")
        #print(f"   Link:     {concert['link']}\n")sdf
else:
    print(f"No concerts were collected for {artist_name}.")