## SRT Python Wrapper with Selenium

This Python script offers a user-friendly interface to search and reserve seats on the SRT (Suseo-Railroad Train).

### Why Selenium?

While it's possible to send raw requests (e.g., using requests.post), such actions may be violate Terms of service. To prevent any possible legal problems, this script utilizes the Selenium Webdriver, which simulates user interactions in a web browser.

### Installation

```bash
pip install -r requirements.txt
```
Make sure to have the appropriate browser driver for Selenium installed. (Firefox or Chrome)

This script uses webdriver_manager, so there's no need to install webdriver manually.

### Usage
 - Search for trains:
```python
from srt_wrapper import SRT

srt = SRT()
available_trains = srt.search(date="2023-09-01", from_station="Seoul", to_station="Busan")
print(available_trains)
```

 - Reserve a seat:
```python
reservation_status = srt.reserve(train_id="12345", seat_type="Economy")
print(reservation_status)
```
### Features
 - Search Trains: Search for available trains between two stations on a specific date.
 - Reserve Seats: Once you find a desired train, you can proceed to reserve a seat.

### Cautions
**Always use this script responsibly.**

 It's designed to aid genuine users and not for misuse or against the terms of the SRT service.
Do not use this tool for bulk operations, macros, or any automated processes that could overwhelm the SRT's system.