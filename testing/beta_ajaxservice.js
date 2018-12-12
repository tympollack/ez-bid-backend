function getItemsUpdate(idBidders, idauctions, idItems){
    //$(".overlay").show();
    $.ajax({
        url : 'bidfta/getUpdateItems',
        type : 'POST',
        data: JSON.stringify({
            'idBidders' : idBidders,
            'idItems' : idItems,
            'idauctions' : idauctions
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            compareAndUpdateItems(response);
            //$(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                //$(".overlay").hide();
            }
        },

    });
}

function placeAjaxBid(idBidders, idItem, idAuctions, currentBid, maxBid){
    $(".overlay").show();
    $.ajax({
        url : 'bidfta/bidAuctionItems',
        type : 'POST',
        data: JSON.stringify({
            'idBidders' : idBidders,
            'idItems' : idItem,
            'idAuctions' : idAuctions,
            'currentBid' : currentBid,
            'maxBid' : maxBid
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            updateItem(response);
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function placeAjaxMaxBid(idBidders, idItem, idAuctions, currentBid, maxBid){
    $(".overlay").show();
    $.ajax({
        url : 'placeMaxBidAuctionItems',
        type : 'POST',
        data: JSON.stringify({
            'idBidders' : idBidders,
            'idItems' : idItem,
            'idAuctions' : idAuctions,
            'currentBid' : currentBid,
            'maxBid' : maxBid,
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            updateItem(response);
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function saveToWatchList(idBidders, idItem, idAuctions){
    $(".overlay").show();
    $.ajax({
        url : 'saveItemToWatchlist',
        type : 'POST',
        data: JSON.stringify({
            'idBidders' : idBidders,
            'idItems' : idItem,
            'idAuctions' : idAuctions
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            addItemToWatchlist(response);
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function deleteFromWatchlist(idBidders, idItem, idAuctions){
    $(".overlay").show();
    $.ajax({
        url : 'deleteItemFromWatchlist',
        type : 'POST',
        data: JSON.stringify({
            'idBidders' : idBidders,
            'idItems' : idItem,
            'idAuctions' : idAuctions
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            removeItemFromWatchlist(response);
            //getpage('watchlist');
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function updateEmailNotificationSetup(notificationText){
    $(".overlay").show();
    $.ajax({
        url : 'bidfta/updateEmailNotificationSetup',
        type : 'POST',
        data: JSON.stringify({
            'notificationText' : notificationText
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            $(".overlay").hide();
            updateItemEmailNotification(response);
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function updateSMSNotificationSetup(notificationText){
    $(".overlay").show();
    $.ajax({
        url : 'bidfta/updateSMSNotificationSetup',
        type : 'POST',
        data: JSON.stringify({
            'notificationText' : notificationText
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            $(".overlay").hide();
            updateItemSMSNotification(response);
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function updateEmailNotificationBidder(notificationText){
    $(".overlay").show();
    $.ajax({
        url : 'updateEmailNotification',
        type : 'POST',
        data: JSON.stringify({
            'notificationText' : notificationText
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            if ($(response).find('header')[0] && $(response).find('#content-holder')[0]) {
                $("#main-container").html($(response).find('#content-holder').html());
            } else {
                $("#main-container").html(response);
            }
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function updateSMSNotificationBidder(notificationText){
    $(".overlay").show();
    $.ajax({
        url : 'updateSMSNotification',
        type : 'POST',
        data: JSON.stringify({
            'notificationText' : notificationText
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            if ($(response).find('header')[0] && $(response).find('#content-holder')[0]) {
                $("#main-container").html($(response).find('#content-holder').html());
            } else {
                $("#main-container").html(response);
            }
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function updateEmailNotificationItem(notificationText){
    $(".overlay").show();
    $.ajax({
        url : 'bidfta/updateEmailNotificationItem',
        type : 'POST',
        data: JSON.stringify({
            'notificationText' : notificationText
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            if ($(response).find('header')[0] && $(response).find('#content-holder')[0]) {
                $("#main-container").html($(response).find('#content-holder').html());
            } else {
                $("#main-container").html(response);
            }
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function updateSMSNotificationItem(notificationText){
    $(".overlay").show();
    $.ajax({
        url : 'bidfta/updateSMSNotificationItem',
        type : 'POST',
        data: JSON.stringify({
            'notificationText' : notificationText
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            if ($(response).find('header')[0] && $(response).find('#content-holder')[0]) {
                $("#main-container").html($(response).find('#content-holder').html());
            } else {
                $("#main-container").html(response);
            }
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function updateCCPrimaryRightPage(idCctokens){
    $(".overlay").show();
    $.ajax({
        url : 'updateCCPrimaryRightPage',
        type : 'POST',
        data:{
            'idCctokens' : idCctokens
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            updateRightPage(response);
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function ajaxBuyitnow(idBidders, idItem, idAuctions, binPrice, binItemQty, idCctokens, idShipping) {
    $(".overlay").show();
    $.ajax({
        url : 'bidfta/buyItNowItems',
        type : 'POST',
        data: JSON.stringify({
            'idBidders' : idBidders,
            'idItems' : idItem,
            'idAuctions' : idAuctions,
            'binPrice' : binPrice,
            'binItemQty' : binItemQty,
            'idCctokens' : idCctokens,
            'idShipping' : idShipping
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            $(".overlay").hide();
            updateItem(response);
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function itemMaoSubmit(idauctions, idbidders, maoiditems, offerprice, maoItemQty, maocomment,
                       idmao, idCctokens, idShipping) {
    //$(".overlay").show();
    $.ajax({
        url : 'bidfta/maoItemSubmit',
        type : 'POST',
        data: JSON.stringify({
            'idAuctions' : idauctions,
            'idBidders' : idbidders,
            'idItems' : maoiditems,
            'maoOfferPrice' : offerprice,
            'maoOfferQty' : maoItemQty,
            'maoComment' : maocomment,
            'idmao' : idmao,
            'idCctokens' : idCctokens,
            'idShipping' : idShipping
        }),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },
        success : function(response) {
            updateMaoItem(response);
            //$(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}

function executeAjaxServiceForForm(formname, callBackFunc) {
    $(".overlay").show();
    var form = $('#' + formname);
    $.ajax({
        url : form.attr('action'),
        type : form.attr('method'),
        data : form.serialize(),
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            $(".overlay").hide();
            callBackFunc(response);
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        }
    });
}

function getBidMax(bidderId, itemId){
    debugger;
    $.ajax({
        url : 'bidfta/getBidMax',
        type : 'POST',
        data: {
            'itemId' : itemId,
            'bidderId' : bidderId
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            var dbMaxBid = response.bidMaxValue;
            if(dbMaxBid == null){
                document.getElementById("maxBid"+itemId).value = "";
            }else{
                document.getElementById("maxBid"+itemId).value = parseFloat(dbMaxBid).toFixed(2);
            }
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                //$(".overlay").hide();
            }
        },

    });
}

function sendSMSToken(phoneNumber, callBackFunc){
    $(".overlay").show();
    $.ajax({
        url : 'sendSMSToken',
        type : 'POST',
        data: {
            'phoneNumber' : phoneNumber
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            $(".overlay").hide();
            callBackFunc();
        },
        error : function(response) {
            $(".overlay").hide();
            startResendVerificationCodeTimerError();
        },

    });
}

function smsCodeVerified(phoneNumber, email){
    $(".overlay").show();
    $.ajax({
        url : 'smsCodeVerified',
        type : 'POST',
        data: {
            'phoneNumber' : phoneNumber,
            'email' : email
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            if(response.success == false){
                sendSMSCode();
            }else{
                $(".overlay").hide();
                smsCodeVerifiedFailed();
            }
        },
        error : function(response) {
            $(".overlay").hide();
            smsCodeVerifiedError();
        },

    });
}

function verifySMSToken(phoneNumber, token){
    $(".overlay").show();
    $.ajax({
        url : 'verifySMSToken',
        type : 'POST',
        data: {
            'phoneNumber' : phoneNumber,
            'token':token
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            $(".overlay").hide();
            verifySMSTokenSuccess();
        },
        error : function(response) {
            $(".overlay").hide();
            verifySMSTokenError();
        }
    });
}

function getSMSNumber(email){
    $.ajax({
        url : 'getSMSNumber',
        type : 'POST',
        data: {
            'email' : email
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            getSMSNumberSuccess(response);
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                //$(".overlay").hide();
            }
        },

    });
}

function updateSMSNumberDB(email, smsNumber){
    $.ajax({
        url : 'updateSMSNumber',
        type : 'POST',
        data: {
            'email' : email,
            'smsNumber' : smsNumber
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            updateSMSNumberDBSuccess(response);
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                //$(".overlay").hide();
            }
        },

    });
}

function verifySMSTokenResend(phoneNumber, token, callBackFunc){
    $(".overlay").show();
    $.ajax({
        url : 'verifySMSToken',
        type : 'POST',
        data: {
            'phoneNumber' : phoneNumber,
            'token':token
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            console.log(response);
            $(".overlay").hide();
            verifySMSTokenResendSuccess(response);
        },
        error : function(response) {
            console.log(response);
            $(".overlay").hide();
            verifySMSTokenResendError();
        }

    });
}

function checkEditedCellPhoneExistForAnyOtherBidder(bidderId, phoneNumber, callBackFunc) {
    $.ajax({
        url : 'checkEditedCellPhoneExistForAnyOtherBidder',
        type : 'POST',
        data: {
            'bidderId' : bidderId,
            'phoneNumber' : phoneNumber
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        success : function(response) {
            debugger;
            if (response.message) {
                $('#smsNumber_msg').html(response.message).css('color', 'red');
            } else {
                callBackFunc();
            }
        },
        error : function(response) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                //$(".overlay").hide();
            }
        }
    });
}

function getBidHistoryList(idItem){
    $(".overlay").show();
    $.ajax({
        url : 'getBidHistoryListItem',
        type : 'POST',
        data: {
            'idItems' : idItem,
        },
        headers: { 'X-CSRF-Token': $("meta[name='_csrf']").attr("content") },
        /*beforeSend: function(xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
        },*/
        success : function(response) {
            getBidHistory(response);
            $(".overlay").hide();
        },
        error : function(res) {
            if (res.status = 403 && res.getResponseHeader("Location")) {
                //invalid csrf
                window.location.href = res.getResponseHeader("Location");
            } else {
                //alert("Error in processing at Server. Please try after sometime. Error : " + res);
                $(".overlay").hide();
            }
        },

    });
}