from bs4 import BeautifulSoup as bs
import requests
import re, json, time
import os, sys
from selenium import webdriver
from selenium.webdriver.firefox.service import Service as FirefoxService
from webdriver_manager.firefox import GeckoDriverManager
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import argparse

url = "https://etk.srail.kr/hpg/hra/01/selectScheduleList.do?pageId=TK0101010000"

station_srt = {551: "수서", 552: "동탄", 553: "평택지제", 502: "천안아산", 297: "오송", 10: "대전", 507: "김천구미", 506: "서대구", 15: "동대구", 508: "신경주", 509: "울산(통도사)", 20: "부산", 514: "공주", 30: "익산", 33: "정읍", 36: "광주송정", 37: "나주", 41: "목포", 512: "창원중앙"}
station_ktx = {1: "서울", 104: "용산", 921: "인천공항T1", 2: "영등포", 501: "광명", 3: "수원", 25: "서대전", 515: "포항", 17: "밀양", 19: "구포", 63: "진주", 59: "마산", 57: "창원", 512: "창원중앙", 56: "진영", 24: "경산", 27: "논산", 45: "전주", 48: "남원", 51: "순천", 53: "여수EXPO", 115: "강릉", 390: "행신", 218: "계룡", 139: "여천", 50: "구례구", 49: "곡성", 516: "횡성", 517: "둔내", 518: "평창", 519: "진부" }
station_all = {**station_srt, **station_ktx}

# chtnDvCd: 직통/환승/사업자환승

times = {}
def lap(num):
    global times
    if cur := times.get(num):
        print(f"lap #{num}: {time.time() - cur}")
        times[num] = time.time()
    else:
        print(f"lap #{num}: 0")
        times[num] = time.time()


def getStationIdFromName(name):
    return list(station_all.keys())[list(station_all.values()).index(name)]

def getTrainSechedule(dept, arrv, date, time):
    if not (24 >= time >= 0):
        print("Wrong Time. Only Hour please.")
        return

    header = {"Origin": "https://etk.srail.kr", "Referer": url, "Host": "etk.srail.kr", "User-Agent": "Mozilla/5.0 (X11; UNIX power-pc; en-US; rv:1.0.0.0) WebKit/1.0.0.0"}
    if dept not in station_all.keys() or arrv not in station_all.keys():
        print("Wrong Station.")
        return
    if dept in station_srt and arrv in station_srt:
        chtn = 1
        trnGp = "300"
    elif (dept in station_srt and arrv in station_ktx) or (dept in station_ktx and arrv in station_srt):
        chtn = 2
        trnGp = "900"

    pageNum = 1
    pad = {"dptRsStnCd": str(dept).zfill(4),
        "arvRsStnCd": str(arrv).zfill(4),
        "stlbTrnClsfCd": "00",
        "psgNum": str(pageNum),
        "seatAttCd": "015",
        "isRequest": "Y",
        "dptRsStnCdNm": station_all[dept],
        "arvRsStnCdNm": station_all[arrv],
        "dptDt": date,
        "dptTm": str(time).zfill(2)+"0000",
        "chtnDvCd": str(chtn),
        "psgInfoPerPrnb1": "1",
        "psgInfoPerPrnb5": "0",
        "psgInfoPerPrnb4": "0",
        "psgInfoPerPrnb2": "0",
        "psgInfoPerPrnb3": "0",
        "locSeatAttCd1": "000",
        "rqSeatAttCd1": "015",
        "trnGpCd": trnGp,
        "dlayTnumAplFlg": "Y",
        }

    html = requests.post(url, headers=header, data=pad).text
    soup = bs(html, features="lxml")

    trains = []
    for idx, tr in enumerate(soup.find("tbody").find_all("tr")):
        td = [i.text.replace("\r", "").replace("\t", "").replace("\n", "") for i in tr.find_all("td")]
        td_trnNo = tr.find("td", class_="trnNo")
        train_detail = dict()
        for i in td_trnNo.find_all("input"):
            train_detail[i["name"].split("[")[0]] = i["value"]
        # print(td)
        train_id = td[2][0:3]
        dept = td[3][:-5]
        arrv = td[4][:-5]
        dept_time = td[3][-5:]
        arrv_time = td[4][-5:]
        seat_first = "예약" in td[5]
        seat_normal = "예약" in td[6]
        trains.append({"id": train_id, "dept": getStationIdFromName(dept), "arrv": getStationIdFromName(arrv), "dept_time": dept_time, "arrv_time": arrv_time, "first": seat_first, "normal": seat_normal, "train": train_detail, "search": pad, "index": idx, "search_time": time})

    return trains

def getSeatInfo(train, grade = "normal", tn = ""):
    train_detail = train.get("train")
    trnInfo = {"runDt1": train_detail.get("runDt"),
        "dptDt1": train_detail.get("dptDt"),
        "dptTm1": train_detail.get("dptTm"),
        "trnNo1": train_detail.get("trnNo"),
        "trnGpCd1": train_detail.get("trnGpCd"),
        "dptRsStnCd1": train_detail.get("dptRsStnCd"),
        "arvRsStnCd1": train_detail.get("arvRsStnCd"),
        "dptStnRunOrdr1": train_detail.get("dptStnRunOrdr"),
        "arvStnRunOrdr1": train_detail.get("arvStnRunOrdr"),
        "seatAttCd1": train_detail.get("seatAttCd"),
        "psrmClCd1": "1" if grade=="normal" else "2",
        "index1": "1",
        "scarNo1": tn,
        "chtnDvCd": "1",
        "jrnySqno": "001",
        "mode": "1",
        "psgNum": "1",
        "pageId": "TK0101010000"}

    html = requests.get("https://etk.srail.kr/hpg/hra/01/selectPassengerResearchList.do", params=trnInfo).text
    soup = bs(html, features="lxml")

    if not tn:
        if not checkAvailable(grade, train):
            return []

        # scars = [i.get("class")[0] for i in soup.find("div", class_="scar").find_all("li") if "off" not in i.get("class")]
        # ret = []
        # for scar in scars:
        #     scar_num = int(scar.split("-")[1])
        #     ret.append(getSeatInfo(train, grade, scar_num))
        # return ret
        ret = {}
        for match in re.findall(r'<li class="scar-(\d{2})(?!.*\boff\b).*?>', html):
            ret[int(match)] = getSeatInfo(train, grade, int(match))
        return ret

    else:
        return [ match for match in re.findall(r"selectSeatInfo\(this, \'([0-9]+)\', \'([0-9]+[A-Z])\'\)", html) ]

def checkAvailable(grade, trn):
    if trn[grade]:
        return 1
    else:
        return 0

def printTrainInfo(trains):
    print(f"Train   Id         DEPT              ARRV           SEAT")
    print(f"-"*60)
    if not isinstance(trains, list):
        trains = [trains]
    for train in trains:
        # print(train["normal"], train["first"])
        if train["normal"] and train["first"]:
            avStr = "All"
        elif train["normal"] and not train["first"]:
            avStr = "Normal"
        elif not train["normal"] and train["first"]:
             avStr = "First"
        elif not train["normal"] and not train["first"]:
           avStr = "None"
        print(f" SRT    {train['id']}  {station_all[train['dept']]:>5} ({train['dept_time']})  {station_all[train['arrv']]:>5} ({train['arrv_time']})       {avStr}")

def watchTrains(dept, arrv, date, time, grade, callback):
    while True:
        trains = getTrainSechedule(dept, arrv, date, time)
        if availTrn := checkIsSeatAvailable(trains, "first"):
            callback(availTrn)
            break
        else:
            print("[*] Nothing, Waiting", end="")
            for i in range(5):
                time.sleep(1)
                print(".", end="")
            print()

def findTrainfromId(id, date, dept, arrv, stime):
    for time in range(stime, 23):
        trains = getTrainSechedule(dept, arrv, date, time)
        for train in trains:
            if int(train["id"]) == id:
                return train
    return

def printSeatInfo(seats):
    for car in seats:
        print(f"Car #{car}" + "|| " + '  '.join([f"{i[1]:>3}{'('+i[0]+')':<4}" for i in seats[car]]), end=" ||\n")

def sel_login(username, password):
    options=Options()
    firefox_profile = FirefoxProfile()
    firefox_profile.set_preference("general.useragent.override", "Mozilla/5.0 (X11; UNIX power-pc; en-US; rv:1.0.0.0) WebKit/1.0.0.0 MachineWeb/1.0.0.0")
    options.profile = firefox_profile
    driver = webdriver.Firefox(service=FirefoxService(GeckoDriverManager().install()), options=options)
    driver.get("https://etk.srail.kr/cmc/01/selectLoginForm.do?pageId=TK0701000000")
    print("Waiting for loading...")
    wait = WebDriverWait(driver, 3)
    element = wait.until(EC.visibility_of_element_located((By.ID, "srchDvNm01")))
    print("Entering ID...")
    input_element = driver.find_element(By.ID, "srchDvNm01")
    input_element.send_keys(username)
    print("Entering PW...")
    input_element = driver.find_element(By.ID, "hmpgPwdCphd01")
    input_element.send_keys(password)
    print("Pressing Enter...")
    input_element.send_keys(Keys.ENTER)
    print("Login succeeded.")
    driver.get(url)
    return driver

def driver_script(driver, cmd):
    print(cmd)
    driver.execute_script(cmd)

def sel_reservate_full(driver, train, car, seat, grade = "first"):    
    srch = train.get("search")
    wait = WebDriverWait(driver, timeout=10)
    element = wait.until(EC.visibility_of_element_located((By.ID, "search-form")))
    print("Entering Info...")
    for ssrc in ["dptRsStnCd", "arvRsStnCd", "dptRsStnCdNm", "arvRsStnCdNm", "dptDt"]:
        driver_script(driver, f"document.getElementById(\"{ssrc}\").value = \"{srch[ssrc]}\";")
    driver_script(driver, f"document.getElementById(\"dptTm\").appendChild(Object.assign(document.createElement('option'), {{ value: '{srch['dptTm']}', selected: true }}));")
    driver_script(driver, f"document.getElementById('search-form').submit();")
    element = wait.until(EC.visibility_of_element_located((By.ID, "result-form")))
    driver_script(driver, f'document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")[{train["index"]}].getElementsByTagName("td")[{5 if grade == "first" else 6}].getElementsByTagName("a")[1].click();')
    element = wait.until(EC.visibility_of_element_located((By.ID, "_LAYER_BODY_")))
    driver_script(driver, f'document.getElementById("_LAYER_BODY_").contentWindow.selectScarInfo(\'{str(car).zfill(4)}\');')
    element = wait.until(EC.visibility_of_element_located((By.ID, "_LAYER_BODY_")))
    driver_script(driver, f'document.getElementById("_LAYER_BODY_").contentDocument.querySelectorAll("li a[onclick*=\'selectSeatInfo(this, \\\\\'{seat}\\\\\'\']")[0].click();')
    driver_script(driver, f'document.getElementById("_LAYER_BODY_").contentWindow.requestReservationInfo();')
    print("Reservation Complete!")
    return

def sel_reservate_fast(driver, train, car, seat, grade = "first"):
    srch = train.get("search")
    wait = WebDriverWait(driver, timeout=10)
    element = wait.until(EC.visibility_of_element_located((By.ID, "search-form")))
    print("Entering Info...")
    for ssrc in ["dptRsStnCd", "arvRsStnCd", "dptRsStnCdNm", "arvRsStnCdNm", "dptDt"]:
        driver_script(driver, f"document.getElementById(\"{ssrc}\").value = \"{srch[ssrc]}\";")
    driver_script(driver, f"document.getElementById(\"dptTm\").appendChild(Object.assign(document.createElement('option'), {{ value: '{srch['dptTm']}', selected: true }}));")
    driver_script(driver, f"document.getElementById('search-form').submit();")
    element = wait.until(EC.visibility_of_element_located((By.ID, "result-form"))) 
    driver_script(driver, f"$$('input[name=scarGridcnt')[{train['index']}] = '1';$$('input[name=scarNo')[{train['index']}] = '{car}';$$('input[name=seatNo_1')[{train['index']}] = {seat};requestReservationInfo($$('.search-list table tbody tr')[{train['index']}].getElementsBySelector('.button')[0],  {train['index']}, {'2' if grade == 'first' else '1'}, '1101', true, true);")
    print("Reservation Complete!")
    return

def sel_close(driver):
    driver.close()

def reserveTrain():
    pass

if "__main__" == __name__:
    #train = findTrainfromId(367, "20230810", 551, 20, 19)["train"]
    #print("&".join([f"{i}={train[i]}" for i in train]))
    id, date, dept, arrv, basetime = (319, "20230810", 551, 20, 8)

    print(f"Finding #{id} in {date} for {dept}->{arrv}")
    if train := findTrainfromId(id, date, dept, arrv, basetime):
        print("Found!\n")
        printTrainInfo(train)
        print("\nNormal-class")
        printSeatInfo(seats := getSeatInfo(train, "normal"))
        print("\nFirst-class")
        printSeatInfo(seats_first := getSeatInfo(train, "first"))
        print()
        car = int(input("Which car? "))
        seat = input("Which seat (Enter number)? ")
        grade = "first" if car in seats_first.keys() else "normal"
        driver = sel_login("2298312946", "*!aQi@2*cE9iaWUX")
        lap(0)
        sel_reservate_full(driver, train, int(car), seat, grade)
        lap(0)
        input()
        sel_close(driver)
    # watchTrains(551, 20, "20230810", 0, "first", printTrainInfo)