import time
from selenium import webdriver
from selenium.webdriver import ChromeOptions, Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
import re


options = ChromeOptions()
#options.add_argument("--headless=new")
options.add_experimental_option("excludeSwitches", ["enable-automation"])

driver = webdriver.Chrome(options=options)
url = "https://twitter.com/i/flow/login"
driver.get(url)

username = WebDriverWait(driver, 20).until(EC.visibility_of_element_located((By.CSS_SELECTOR, 'input[autocomplete="username"]')))
username.send_keys("lmao12345645855")
username.send_keys(Keys.ENTER)

password = WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, 'input[name="password"]')))
password.send_keys("joksun125")
password.send_keys(Keys.ENTER)

time.sleep(5)

try:
    username = "ado1024imokenp"   # change this
    url = f"https://x.com/{username}"
    driver.get(url)

    # Wait for first tweet to load
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.XPATH, "//article[@data-testid='tweet']"))
    )

    collected = []
    seen = set()
    last_height = driver.execute_script("return document.body.scrollHeight")

    while len(collected) < 50:
        # get all tweet articles currently loaded
        tweets = driver.find_elements(By.XPATH, "//article[@data-testid='tweet']")

        for t in tweets:
            try:
                tweet_id = t.id
                if tweet_id in seen:
                    continue
                seen.add(tweet_id)

                # check for pinned/retweeted labels

                # get text content
                text_blocks = t.find_elements(By.XPATH, ".//div[@data-testid='tweetText']")
                text = " ".join(block.text for block in text_blocks).strip()
                if text and text not in collected:
                    collected.append(text)
                    print(f"Got tweet #{len(collected)}: {text[:60]}...")

                    if len(collected) >= 50:
                        break
            except Exception:
                continue

        # scroll down
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, "//article[@data-testid='tweet']"))
        )
        time.sleep(1)# wait for new tweets to load

        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:  # no more tweets
            break
        last_height = new_height

    print("\n--- Final Collected Tweets ---")
    for i, t in enumerate(collected, start=1):
        print(f"{i}. {t}\n")
    print("\n")
    
    # Concert-related terms
    concert_pattern = re.compile(
        r"\b(concert|gig|live show|live music|music festival|festival|tour|show)\b",
        re.IGNORECASE
    )

    # Date-like expressions:
    # - Matches formats like "Sept 15", "September 15th", "9/15", "2025-09-15", etc.
    date_pattern = re.compile(
        r"\b("
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(st|nd|rd|th)?"
        r"|"
        r"\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?"
        r"|"
        r"\d{4}-\d{2}-\d{2}"
        r"|"
        r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?"
        r")\b",
        re.IGNORECASE
    )
    
    concerts_with_dates = []
    
    for t in collected:
        if concert_pattern.search(t):
            has_date = bool(date_pattern.search(t))
            concerts_with_dates.append({
                "text": t,
                "mentions_concert": True,
                "mentions_date": has_date
            })
    
    for i, tweet in enumerate(concerts_with_dates, start=1):
        print(f"{i}. {tweet['text']}")
        print(f"   -> Mentions Date: {tweet['mentions_date']}\n")
        
    print("-----------------------------------------------------------------")

finally:
    driver.quit()