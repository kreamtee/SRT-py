function requestReservationInfo(element, index, psrmClCd, jobId, isLast, isCfrm) { 
        
        if (!checkScheduleInfo(false)) {
            return;
        }
    
        var source = $('search-form');
        var target = $('insert-form');
    
        var trnNo = $$('input[name="trnNo[' + index + ']"]')[0].value;
        var psgInfoPerPrnb4 = parseInt(source.psgInfoPerPrnb4.options[source.psgInfoPerPrnb4.selectedIndex].value);
        var psgInfoPerPrnb3 = parseInt(source.psgInfoPerPrnb3.options[source.psgInfoPerPrnb3.selectedIndex].value);
    
        if($('search-form').dptDt.value == '20220105' && Number(trnNo).toString().substring(0,1) == '3'){
            if(!confirm("선택한 열차는 지연 열차입니다.\n열차운행 사항을 확인하시고 구입하시기 바랍니다.\n승차권 구입 시 열차지연에 따른 지연배상을 하지 않습니다.\n\n구입하시겠습니까?")){
                return;
            }
        }
        
        
        
        if((trnNo == '00690' || trnNo == '690')&&(psgInfoPerPrnb4 > 0 || psgInfoPerPrnb3 > 0)){
            if(!Navi.showLoading('경로, 경증장애인, 단체 할인은 출근열차(#690) 특가상품보다 할인율이 적습니다. 특가상품으로 예매하시려면, 인원정보에서 \'어른\'을 선택하여 개별로 예매하여 주시기 바랍니다.')){
                return;
            } else{
                Navi.hideLoading();
            }
        }
    
        if (!isCfrm) {
            switch (source.rqSeatAttCd1.options[source.rqSeatAttCd1.selectedIndex].value) {
                case '021' : // 휠체어
                case '028' : // 전동휠체어
                    if (!confirm('장애인 또는 유공자 등 휠체어 이용자에 한하여 이용하실 수 있습니다.\n정당한 이용자가 아닌 고객의 경우 부가운임을 징수합니다.\n\n예약을 진행하시겠습니까?')) {
                        clearReservationInfo();
                        return;
                    }
    
                    break;
            }
        }
    
        target.rsvTpCd.value     = '01';
        target.jobId.value       = jobId;
        target.totPrnb.value     = source.psgNum.value;
        target.stndFlg.value     = 'N';
        target.psgGridcnt.value  = '0';
        target.mutMrkVrfCd.value = (window.name == CRS_WIN_NM_SR) ? '' : '';
        target.reqTime.value     = (new Date()).getTime();
    
        // 승객유형
        var psgGridcnt = 1;
    
        //동반유아
//      target.autoSaleKidsNum.value = source.psgInfoPerPrnb6.options[source.psgInfoPerPrnb6.selectedIndex].value
//      source.psgInfoPerPrnb6.selectedIndex = 0;
//      source.psgInfoPerPrnb5.selectedIndex = parseInt(source.psgInfoPerPrnb5.selectedIndex) + parseInt(target.autoSaleKidsNum.value);
        
        source.getElementsBySelector('select').findAll(function (s, i) {
            if (s.getAttribute('name').indexOf('psgInfoPerPrnb') < 0) {
                return;
            }
                                
            if (s.selectedIndex > 0) {
                //if(s.getAttribute('name').substr(s.getAttribute('name').length - 1, 1) <= 5){ //동반유아
                    $$('input[name=psgTpCd' + psgGridcnt + ']')[0].value = s.getAttribute('name').substr(s.getAttribute('name').length - 1, 1);
                    $$('input[name=psgInfoPerPrnb' + psgGridcnt + ']')[0].value = s.options[s.selectedIndex].value;
                //}
                target.psgGridcnt.value = parseInt(target.psgGridcnt.value) + 1;
                psgGridcnt++;
            }
        }.bind(this));
    
        
        
        // 열차정보
        var isPass = jobId != '1103';
    
        // 직통/환승 처리
        var chtnDvCd = Common.radio(source.chtnDvCd, 1);
    
        if (chtnDvCd == '2') {
            var stlbTrnClsfCd1, stlbTrnClsfCd2;
    
            switch ($$('input[name="jrnySqno[' + index + ']"]')[0].value) {
                case '001' :
                    stlbTrnClsfCd1 = $$('input[name="stlbTrnClsfCd[' + index + ']"]')[0].value;
                    stlbTrnClsfCd2 = $$('input[name="stlbTrnClsfCd[' + (index + 1) + ']"]')[0].value;
                    break;
                case '002' :
                    stlbTrnClsfCd1 = $$('input[name="stlbTrnClsfCd[' + (index - 1) + ']"]')[0].value;
                    stlbTrnClsfCd2 = $$('input[name="stlbTrnClsfCd[' + index + ']"]')[0].value;
                    break;
            }
    
            if ((stlbTrnClsfCd1 == '17' && stlbTrnClsfCd1 != stlbTrnClsfCd2) || (stlbTrnClsfCd2 == '17' && stlbTrnClsfCd1 != stlbTrnClsfCd2)) {
                chtnDvCd = '3';
            }
        }
    
        switch (chtnDvCd) {
            case '1' : // 직통
            case '3' : // 사업자간 환승
                if (!isCfrm) {
                    if (chtnDvCd == '3' && !confirm('선택하신 열차는 SRT와 코레일 열차를 같이 이용하는 연결정보입니다.\n\n예약 및 발권이 완료된 후 [코레일 열차예약] 버튼을 클릭하여 코레일 사이트로 이동하신 후 연결구간 예약을 진행하십시오.')) {
                        clearReservationInfo();
                        return;
                    }
                    /*
                    else if ('N' != 'Y' && chtnDvCd == '1' && parseFloat($$('input[name="trainDiscGenRt[' + index + ']"]')[0].value) > 1.0 && !confirm('1. 해당 할인상품의 위약금은 일반승차권 환불규정을 적용합니다.\n\n'
                            + '2. 일정 변경은 SRT앱, 홈페이지, 역에서 취소한 후 다시 구매하셔야 합니다.(※ 이 경우 할인율이 변동될 수 있습니다.)\n\n'
                            + '3. 특실은 운임만 할인됩니다.\n\n'
                            + '4. 위 내용을 확인하였으며 동의합니다.')) {
                        clearReservationInfo();
                        return;
                    }
                    */
                }
    
                target.jrnyTpCd.value        = '11';
                target.jrnyCnt.value         = '1';
                target.trnOrdrNo1.value      = $$('input[name="trnOrdrNo[' + index + ']"]')[0].value;
                target.jrnySqno1.value       = '001';
                target.runDt1.value          = $$('input[name="runDt[' + index + ']"]')[0].value;
                target.trnNo1.value          = $$('input[name="trnNo[' + index + ']"]')[0].value;
                target.trnGpCd1.value        = $$('input[name="trnGpCd[' + index + ']"]')[0].value;
                target.stlbTrnClsfCd1.value  = $$('input[name="stlbTrnClsfCd[' + index + ']"]')[0].value;
                target.dptDt1.value          = $$('input[name="dptDt[' + index + ']"]')[0].value;
                target.dptTm1.value          = $$('input[name="dptTm[' + index + ']"]')[0].value;
                target.dptRsStnCd1.value     = $$('input[name="dptRsStnCd[' + index + ']"]')[0].value;
                target.dptStnConsOrdr1.value = $$('input[name="dptStnConsOrdr[' + index + ']"]')[0].value;
                target.dptStnRunOrdr1.value  = $$('input[name="dptStnRunOrdr[' + index + ']"]')[0].value;
                target.arvRsStnCd1.value     = $$('input[name="arvRsStnCd[' + index + ']"]')[0].value;
                target.arvStnConsOrdr1.value = $$('input[name="arvStnConsOrdr[' + index + ']"]')[0].value;
                target.arvStnRunOrdr1.value  = $$('input[name="arvStnRunOrdr[' + index + ']"]')[0].value;
                target.scarYn1.value         = isPass ? 'N' : 'Y';
                target.scarGridcnt1.value    = isPass ? '' : $$('input[name="scarGridcnt[' + index + ']"]')[0].value;
                target.scarNo1.value         = isPass ? '' : $$('input[name="scarNo[' + index + ']"]')[0].value;
                target.seatNo1_1.value       = isPass ? '' : $$('input[name="seatNo_1[' + index + ']"]')[0].value;
                target.seatNo1_2.value       = isPass ? '' : $$('input[name="seatNo_2[' + index + ']"]')[0].value;
                target.seatNo1_3.value       = isPass ? '' : $$('input[name="seatNo_3[' + index + ']"]')[0].value;
                target.seatNo1_4.value       = isPass ? '' : $$('input[name="seatNo_4[' + index + ']"]')[0].value;
                target.seatNo1_5.value       = isPass ? '' : $$('input[name="seatNo_5[' + index + ']"]')[0].value;
                target.seatNo1_6.value       = isPass ? '' : $$('input[name="seatNo_6[' + index + ']"]')[0].value;
                target.seatNo1_7.value       = isPass ? '' : $$('input[name="seatNo_7[' + index + ']"]')[0].value;
                target.seatNo1_8.value       = isPass ? '' : $$('input[name="seatNo_8[' + index + ']"]')[0].value;
                target.seatNo1_9.value       = isPass ? '' : $$('input[name="seatNo_9[' + index + ']"]')[0].value;
                target.psrmClCd1.value       = psrmClCd;
                target.smkSeatAttCd1.value   = '000';
                target.dirSeatAttCd1.value   = '000';
                target.locSeatAttCd1.value   = source.locSeatAttCd1.options[source.locSeatAttCd1.selectedIndex].value;
                target.rqSeatAttCd1.value    = source.rqSeatAttCd1.options[source.rqSeatAttCd1.selectedIndex].value;
                target.etcSeatAttCd1.value   = '000';
                target.crossYn.value         = (chtnDvCd == '3') ? 'Y' : 'N';
    
                //if (chtnDvCd != '3' && !$(element).hasClassName('on')) {
                    
                if (chtnDvCd != '3' && !$(element).hasClassName('on')) {
                    $(element).addClassName('on');
                }
    
                break;
            case '2' : // 환승
                target.jrnyTpCd.value = '14';
                target.jrnyCnt.value  = '2';
                target.crossYn.value  = 'N';
    
                switch ($$('input[name="jrnySqno[' + index + ']"]')[0].value) {
                    case '001' : // 선행
                        if (target.trnOrdrNo1.value != '' && target.trnOrdrNo1.value != $$('input[name="trnOrdrNo[' + index + ']"]')[0].value) {
                            window.alert('이미 선택하신 선행 열차가 존재합니다.');
                            return;
                        } else if (target.trnOrdrNo1.value != '' && target.psrmClCd1.value != psrmClCd) {
                            window.alert('해당 열차의 다른 객실을 선택하셨습니다.');
                            return;
                        } else if (target.trnOrdrNo2.value != '' && target.trnOrdrNo2.value != $$('input[name="trnOrdrNo[' + index + ']"]')[0].value) {
                            window.alert('선택하신 열차는 환승 대상 열차가 아닙니다.');
                            return;
                        } else if (isPass && target.scarYn1.value == 'Y') {
                            window.alert('이미 선택하신 선행 열차가 존재합니다.');
                            return;
                        } else if (isPass && target.scarYn2.value == 'Y') {
                            window.alert('좌석선택예약은 선/후행 모두 좌석을 선택하셔야 합니다.');
                            return;
                        }
                        /*
                        else if ('N' != 'Y' && !$(element).hasClassName('on') && parseFloat($$('input[name="trainDiscGenRt[' + index + ']"]')[0].value) > 1.0 && !confirm('1. 해당 할인상품의 위약금은 일반승차권 환불규정을 적용합니다.\n\n'
                                + '2. 일정 변경은 SRT앱, 홈페이지, 역에서 취소한 후 다시 구매하셔야 합니다.(※ 이 경우 할인율이 변동될 수 있습니다.)\n\n'
                                + '3. 특실은 운임만 할인됩니다.\n\n'
                                + '4. 위 내용을 확인하였으며 동의합니다.')) {
                            return;
                        }
                        */
    
                        target.trnOrdrNo1.value      = isPass && $(element).hasClassName('on') ? '' : $$('input[name="trnOrdrNo[' + index + ']"]')[0].value;
                        target.jrnySqno1.value       = isPass && $(element).hasClassName('on') ? '' : $$('input[name="jrnySqno[' + index + ']"]')[0].value;
                        target.runDt1.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="runDt[' + index + ']"]')[0].value;
                        target.trnNo1.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="trnNo[' + index + ']"]')[0].value;
                        target.trnGpCd1.value        = isPass && $(element).hasClassName('on') ? '' : $$('input[name="trnGpCd[' + index + ']"]')[0].value;
                        target.stlbTrnClsfCd1.value  = isPass && $(element).hasClassName('on') ? '' : $$('input[name="stlbTrnClsfCd[' + index + ']"]')[0].value;
                        target.dptDt1.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptDt[' + index + ']"]')[0].value;
                        target.dptTm1.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptTm[' + index + ']"]')[0].value;
                        target.dptRsStnCd1.value     = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptRsStnCd[' + index + ']"]')[0].value;
                        target.dptStnConsOrdr1.value = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptStnConsOrdr[' + index + ']"]')[0].value;
                        target.dptStnRunOrdr1.value  = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptStnRunOrdr[' + index + ']"]')[0].value;
                        target.arvRsStnCd1.value     = isPass && $(element).hasClassName('on') ? '' : $$('input[name="arvRsStnCd[' + index + ']"]')[0].value;
                        target.arvStnConsOrdr1.value = isPass && $(element).hasClassName('on') ? '' : $$('input[name="arvStnConsOrdr[' + index + ']"]')[0].value;
                        target.arvStnRunOrdr1.value  = isPass && $(element).hasClassName('on') ? '' : $$('input[name="arvStnRunOrdr[' + index + ']"]')[0].value;
                        target.scarYn1.value         = isPass && $(element).hasClassName('on') ? '' : isPass ? 'N' : 'Y';
                        target.scarGridcnt1.value    = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="scarGridcnt[' + index + ']"]')[0].value;
                        target.scarNo1.value         = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="scarNo[' + index + ']"]')[0].value;
                        target.seatNo1_1.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_1[' + index + ']"]')[0].value;
                        target.seatNo1_2.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_2[' + index + ']"]')[0].value;
                        target.seatNo1_3.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_3[' + index + ']"]')[0].value;
                        target.seatNo1_4.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_4[' + index + ']"]')[0].value;
                        target.seatNo1_5.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_5[' + index + ']"]')[0].value;
                        target.seatNo1_6.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_6[' + index + ']"]')[0].value;
                        target.seatNo1_7.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_7[' + index + ']"]')[0].value;
                        target.seatNo1_8.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_8[' + index + ']"]')[0].value;
                        target.seatNo1_9.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_9[' + index + ']"]')[0].value;
                        target.psrmClCd1.value       = isPass && $(element).hasClassName('on') ? '' : psrmClCd;
                        target.smkSeatAttCd1.value   = isPass && $(element).hasClassName('on') ? '' : '000';
                        target.dirSeatAttCd1.value   = isPass && $(element).hasClassName('on') ? '' : '000';
                        target.locSeatAttCd1.value   = isPass && $(element).hasClassName('on') ? '' : source.locSeatAttCd1.options[source.locSeatAttCd1.selectedIndex].value;
                        target.rqSeatAttCd1.value    = isPass && $(element).hasClassName('on') ? '' : source.rqSeatAttCd1.options[source.rqSeatAttCd1.selectedIndex].value;
                        target.etcSeatAttCd1.value   = isPass && $(element).hasClassName('on') ? '' : '000';
    
                        break;
                    case '002' : // 후행
                        if (target.trnOrdrNo2.value != '' && target.trnOrdrNo2.value != $$('input[name="trnOrdrNo[' + index + ']"]')[0].value) {
                            window.alert('이미 선택하신 후행 열차가 존재합니다.');
                            return;
                        } else if (target.trnOrdrNo2.value != '' && target.psrmClCd2.value != psrmClCd) {
                            window.alert('해당 열차의 다른 객실을 선택하셨습니다.');
                            return;
                        } else if (target.trnOrdrNo1.value != '' && target.trnOrdrNo1.value != $$('input[name="trnOrdrNo[' + index + ']"]')[0].value) {
                            window.alert('선택하신 열차는 환승 대상 열차가 아닙니다.');
                            return;
                        } else if (isPass && target.scarYn2.value == 'Y') {
                            window.alert('이미 선택하신 선행 열차가 존재합니다.');
                            return;
                        } else if (isPass && target.scarYn1.value == 'Y') {
                            window.alert('좌석선택예약은 선/후행 모두 좌석을 선택하셔야 합니다.');
                            return;
                        }
                        /*
                        else if ('N' != 'Y' && !$(element).hasClassName('on') && parseFloat($$('input[name="trainDiscGenRt[' + index + ']"]')[0].value) > 1.0 && !confirm('1. 해당 할인상품의 위약금은 일반승차권 반환규정을 적용합니다.\n\n'
                                + '2. 일정 변경은 SRT앱, 홈페이지, 역에서 취소한 후 다시 구매하셔야 합니다.(※ 이 경우 할인율이 변동될 수 있습니다.)\n\n'
                                + '3. 특실은 운임만 할인됩니다.\n\n'
                                + '4. 위 내용을 확인하였으며 동의합니다.')) {
                            return;
                        }
                        */
                        target.trnOrdrNo2.value      = isPass && $(element).hasClassName('on') ? '' : $$('input[name="trnOrdrNo[' + index + ']"]')[0].value;
                        target.jrnySqno2.value       = isPass && $(element).hasClassName('on') ? '' : $$('input[name="jrnySqno[' + index + ']"]')[0].value;
                        target.runDt2.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="runDt[' + index + ']"]')[0].value;
                        target.trnNo2.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="trnNo[' + index + ']"]')[0].value;
                        target.trnGpCd2.value        = isPass && $(element).hasClassName('on') ? '' : $$('input[name="trnGpCd[' + index + ']"]')[0].value;
                        target.stlbTrnClsfCd2.value  = isPass && $(element).hasClassName('on') ? '' : $$('input[name="stlbTrnClsfCd[' + index + ']"]')[0].value;
                        target.dptDt2.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptDt[' + index + ']"]')[0].value;
                        target.dptTm2.value          = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptTm[' + index + ']"]')[0].value;
                        target.dptRsStnCd2.value     = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptRsStnCd[' + index + ']"]')[0].value;
                        target.dptStnConsOrdr2.value = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptStnConsOrdr[' + index + ']"]')[0].value;
                        target.dptStnRunOrdr2.value  = isPass && $(element).hasClassName('on') ? '' : $$('input[name="dptStnRunOrdr[' + index + ']"]')[0].value;
                        target.arvRsStnCd2.value     = isPass && $(element).hasClassName('on') ? '' : $$('input[name="arvRsStnCd[' + index + ']"]')[0].value;
                        target.arvStnConsOrdr2.value = isPass && $(element).hasClassName('on') ? '' : $$('input[name="arvStnConsOrdr[' + index + ']"]')[0].value;
                        target.arvStnRunOrdr2.value  = isPass && $(element).hasClassName('on') ? '' : $$('input[name="arvStnRunOrdr[' + index + ']"]')[0].value;
                        target.scarYn2.value         = isPass && $(element).hasClassName('on') ? '' : isPass ? 'N' : 'Y';
                        target.scarGridcnt2.value    = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="scarGridcnt[' + index + ']"]')[0].value;
                        target.scarNo2.value         = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="scarNo[' + index + ']"]')[0].value;
                        target.seatNo2_1.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_1[' + index + ']"]')[0].value;
                        target.seatNo2_2.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_2[' + index + ']"]')[0].value;
                        target.seatNo2_3.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_3[' + index + ']"]')[0].value;
                        target.seatNo2_4.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_4[' + index + ']"]')[0].value;
                        target.seatNo2_5.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_5[' + index + ']"]')[0].value;
                        target.seatNo2_6.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_6[' + index + ']"]')[0].value;
                        target.seatNo2_7.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_7[' + index + ']"]')[0].value;
                        target.seatNo2_8.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_8[' + index + ']"]')[0].value;
                        target.seatNo2_9.value       = isPass && $(element).hasClassName('on') ? '' : isPass ? '' : $$('input[name="seatNo_9[' + index + ']"]')[0].value;
                        target.psrmClCd2.value       = isPass && $(element).hasClassName('on') ? '' : psrmClCd;
                        target.smkSeatAttCd2.value   = isPass && $(element).hasClassName('on') ? '' : '000';
                        target.dirSeatAttCd2.value   = isPass && $(element).hasClassName('on') ? '' : '000';
                        target.locSeatAttCd2.value   = isPass && $(element).hasClassName('on') ? '' : source.locSeatAttCd1.options[source.locSeatAttCd1.selectedIndex].value;
                        target.rqSeatAttCd2.value    = isPass && $(element).hasClassName('on') ? '' : source.rqSeatAttCd1.options[source.rqSeatAttCd1.selectedIndex].value;
                        target.etcSeatAttCd2.value   = isPass && $(element).hasClassName('on') ? '' : '000';
    
                        break;
                    default :
                        window.alert('유효하지 않은 여정 순서입니다.');
                        return;
                }
    
                if (isPass) {
                    if ($(element).hasClassName('on')) {
                        $(element).removeClassName('on');                       
                        $(element).removeClassName('btn_pastel1');
                        $(element).addClassName('btn_burgundy_dark');
                        $(element).update('<span>예약하기</span>');
                    } else {
                        $(element).addClassName('on');
                        $(element).removeClassName('btn_burgundy_dark');
                        $(element).addClassName('btn_pastel1');
                        $(element).update('<span>예약대기</span>');
                    }
                }
    
                if (target.trnOrdrNo1.value == '' || target.trnOrdrNo2.value == '') { // 최초 선택
                    return;
                }
    
                break;
            default :
                window.alert('유효하지 않은 여정 유형입니다.');
                return;
        }
    
        if (isLast) {
            if (chtnDvCd == '3' && !selectKorailInfo(index + ($$('input[name="jrnySqno[' + index + ']"]')[0].value == '001' ? 1 : -1), true, 'Y', target.reqTime.value)) {
                window.alert('코레일 열차정보를 저장하는데 실패하였습니다.');
                return;
            }
    
            //동반유아
//          console.log("==================================================");
//          for (var i = 1; i <= 6; i++) {
//              console.log("psgTpCd"+i+" : "+$$('input[name=psgTpCd'+i+']')[0].value);
//              console.log("psgInfoPerPrnb"+i+" : "+$$('input[name=psgInfoPerPrnb'+i+']')[0].value);
//          }
//          console.log("동반유아 : "+target.autoSaleKidsNum.value);
//          console.log("==================================================");
            if (Navi.showLoading()) {
                target.submit();
            }
        }
    }