/*
 * (C) Copyright 2016 NUBOMEDIA (http://www.nubomedia.eu)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var ws = new WebSocket('wss://' + location.host + '/repository');
var videoInput;
var videoOutput;
var webRtcPeer;
var state = null;

const NO_CALL = 0;
const IN_CALL = 1;
const POST_CALL = 2;
const DISABLED = 3;
const IN_PLAY = 4;
const IN_PUBLISH = 5;

window.onload = function() {
	console = new Console();
	console.log('Page loaded ...');
	videoInput = document.getElementById('videoInput');
	videoOutput = document.getElementById('videoOutput');
	setState(NO_CALL);
}

window.onbeforeunload = function() {
	ws.close();
}

function setState(nextState) {
	switch (nextState) {
	case NO_CALL:
		enableButton('#start', 'start()');
		disableButton('#stop');
		disableButton('#play');
		disableButton('#share');
		break;
	case DISABLED:
		disableButton('#start');
		disableButton('#stop');
		disableButton('#play');
		disableButton('#share');
		break;
	case IN_CALL:
	case IN_PLAY:
		disableButton('#start');
		enableButton('#stop', 'stop()');
		disableButton('#play');
		disableButton('#share');
		break;
	case POST_CALL:
		enableButton('#start', 'start()');
		disableButton('#stop');
		enableButton('#play', 'play()');
		enableButton('#share', 'share()');
		break;
	case IN_PUBLISH:
		disableButton('#start');
		disableButton('#stop');
		disableButton('#play');
		disableButton('#share');
		break;
	default:
		onError('Unknown state ' + nextState);
		return;
	}
	state = nextState;
}

function enableButton(id, onclick) {
	$(id).attr('disabled', false);
	$(id).attr('onclick', onclick);
}

function disableButton(id) {
	$(id).attr('disabled', true);
	$(id).removeAttr('onclick');
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
	case 'startResponse':
		startResponse(parsedMessage);
		break;
	case 'playResponse':
		playResponse(parsedMessage);
		break;
	case 'playEnd':
		playEnd();
		break;
	case 'publishResponse':
        publishResponse(parsedMessage);
		break;
    case 'publishFinished':
       	publishEnd();
		break;
	case 'error':
		setState(NO_CALL);
		onError('Error message from server: ' + parsedMessage.message);
		break;
	case 'iceCandidate':
		webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
			if (error)
				return console.error('Error adding candidate: ' + error);
		});
		break;
	case 'notEnoughResources':
		stop(false);
		$('#resourcesDialog').modal('show');
		break;		
	default:
		setState(NO_CALL);
		onError('Unrecognized message', parsedMessage);
	}
}

function start() {
	console.log('Starting video call ...');

	// Disable start button
	setState(DISABLED);
	showSpinner(videoInput, videoOutput);

	console.log('Creating WebRtcPeer and generating local sdp offer ...');

	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		onicecandidate : onIceCandidate
	}
	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
			function(error) {
				if (error)
					return console.error(error);
				webRtcPeer.generateOffer(onOffer);
			});
}

function onOffer(error, offerSdp) {
	if (error)
		return console.error('Error generating the offer');
	console.info('Invoking SDP offer callback function ' + location.host);
	var message = {
		id : 'start',
		sdpOffer : offerSdp
	}
	sendMessage(message);
}

function onError(error) {
	console.error(error);
}

function onIceCandidate(candidate) {
	console.log('Local candidate' + JSON.stringify(candidate));

	var message = {
		id : 'onIceCandidate',
		candidate : candidate
	};
	sendMessage(message);
}

function startResponse(message) {
	setState(IN_CALL);
	console.log('SDP answer received from server. Processing ...');

	webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
		if (error)
			return console.error(error);
	});
}

function stop() {
	var stopMessageId = (state == IN_CALL) ? 'stop' : 'stopPlay';
	console.log('Stopping video while in ' + state + '...');
	setState(POST_CALL);
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;

		var message = {
			id : stopMessageId
		}
		sendMessage(message);
	}
	hideSpinner(videoInput, videoOutput);
}

function play() {
	console.log("Starting to play recorded video...");

	// Disable start button
	setState(DISABLED);
	showSpinner(videoOutput);

	console.log('Creating WebRtcPeer and generating local sdp offer ...');

	var options = {
		remoteVideo : videoOutput,
		onicecandidate : onIceCandidate
	}
	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
			function(error) {
				if (error)
					return console.error(error);
				webRtcPeer.generateOffer(onPlayOffer);
			});
}

function onPlayOffer(error, offerSdp) {
	if (error)
		return console.error('Error generating the offer');
	console.info('Invoking SDP offer callback function ' + location.host);
	var message = {
		id : 'play',
		sdpOffer : offerSdp
	}
	sendMessage(message);
}

function playResponse(message) {
	setState(IN_PLAY);
	webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
		if (error)
			return console.error(error);
	});
}

function playEnd() {
	setState(POST_CALL);
	hideSpinner(videoInput, videoOutput);
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Sending message: ' + jsonMessage);
	ws.send(jsonMessage);
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent.png';
		arguments[i].style.background = "center transparent url('./img/spinner.gif') no-repeat";
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/webrtc.png';
		arguments[i].style.background = '';
	}
}

function publish() {
    console.log("publishing recorded video...");
	setState(DISABLED);
	showSpinner(videoOutput);
	
	var title = $("#InputTitle").val();
	var desc = $("#InputDescription").val();
	var tags = $("#InputTags").val();
	var arrayTags = tags.split(',');
	
	var message = {
			id : 'publish',
			metaData : {
	    				"title": title,
	    				"description": desc,
	   					"tags": arrayTags	    				
			}
		}
		sendMessage(message);
}

function publishResponse(message) {
	setState(IN_PUBLISH);
	
	console.log('Publishing video response:  ...');
	console.log(message.msg);

}

function publishEnd(){
	setState(POST_CALL);
	hideSpinner(videoOutput);
	$('#publishModal').modal('hide');
}


/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
