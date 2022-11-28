$(document).ready(function(){
	var blobs = recordedBlobs;
	var player;
	var trimslider = document.getElementById('trimslider');
	var removeslider = document.getElementById('removeslider');
	var setup = true;
	var res = [];
	var num_reqs = -1;
	var sent_reqs = 0;
	
	// Show recorded video
	if (url == "" || url == null) {
		// Show recorded video
    var superBuffer = new Blob(recordedBlobs, {
				type: 'video/webm'
		});
	
		// Create the src url from the blob. #t=duration is a Chrome bug workaround, as the webm generated through Media Recorder has a N/A duration in its metadata, so you can't seek the video in the player. Using Media Fragments (https://www.w3.org/TR/media-frags/#URIfragment-user-agent) and setting the duration manually in the src url fixes the issue.
		var url = window.URL.createObjectURL(superBuffer);
	}

	//$("#video").attr("src", url);
	$("#video").attr("src", url);
	$("#g-savetodrive").attr("src", url);
	// $("#format-select").niceSelect();
	$("#meeting-type-select").niceSelect();
	
	
	// Convert seconds to timestamp
	function timestamp(value) {
			var sec_num = value;
			var hours   = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);

			if (hours   < 10) {hours   = "0"+hours;}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}
			return hours+':'+minutes+':'+seconds;
	}
	
	// Initialize range sliders
	function initRanges() {
			noUiSlider.create(trimslider, {
					start: [blobs.length],
					connect: "upper",
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#trim-end input").val(timestamp(blobs.length));
			
			noUiSlider.create(removeslider, {
					start: [0, blobs.length],
					connect: true,
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#remove-end input").val(timestamp(blobs.length));
	}
	
	// Update range values
	function updateRanges(blobs) {
			trimslider.noUiSlider.updateOptions({
				 start: [blobs.length],
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#trim-start input").val(timestamp(0));
			$("#trim-end input").val(timestamp(blobs.length));
			
			removeslider.noUiSlider.updateOptions({
				 start: [0, blobs.length],
					range: {
							'min': 0,
							'max': blobs.length
					}
			});
			$("#remove-start input").val(timestamp(0));
			$("#remove-end input").val(timestamp(blobs.length));
			window.setTimeout(function(){
					player.currentTime = 0;
			}, 500)
			player.restart();
	}
	
	// Reset video
	function reset() {
			blobs = recordedBlobs;
			var superBuffer = new Blob(blobs, {
					type: 'video/webm'
			});
			var url = window.URL.createObjectURL(superBuffer);
			$("#video").attr("src", url+"#t="+blobs.length);
			updateRanges(blobs);
	}
	
	// Trim video between two values
	function trim(a, b) {
			blobs = blobs.slice(a, b);
			var superBuffer = new Blob(blobs, {
					type: 'video/webm'
			});
			var url = window.URL.createObjectURL(superBuffer);
			$("#video").attr("src", url+"#t="+blobs.length);
			updateRanges(blobs);
	}
	
	// Remove part of the video
	function remove(a, b) {
			var start = blobs.slice(0, a);
			var end = blobs.slice(b, blobs.length);
			blobs = start.concat(end);
			var superBuffer = new Blob(blobs, {
					type: 'video/webm'
			});
			var url = window.URL.createObjectURL(superBuffer);
			$("#video").attr("src", url+"#t="+blobs.length);
			updateRanges(blobs);
	}
	
	// Download video in different formats
	function download() {
			downloaded = true;
			var superBuffer = new Blob(blobs, {
				type: 'video/webm'
			});
			convertStreams(superBuffer, "mp3");
		// 	$("#download-label").html(chrome.i18n.getMessage("downloading"))
		// 	if ($("#format-select").val() == "mp4") {
		// 		ysFixWebmDuration(blobs, blobs.length, function(fixedBlob) {
		// 			var superBuffer = new Blob(fixedBlob, {
		// 					type: 'video/mp4'
		// 			});
		// 			var url = window.URL.createObjectURL(superBuffer);
		// 			chrome.downloads.download({
		// 					url: url
		// 			});
		// 			$("#download-label").html(chrome.i18n.getMessage("download"))
		// 		});
		// 	} else if ($("#format-select").val() == "webm") {
		// 		ysFixWebmDuration(blobs, blobs.length, function(fixedBlob) {
		// 			var superBuffer = new Blob(fixedBlob, {
		// 					type: 'video/webm'
		// 			});
		// 			var url = window.URL.createObjectURL(superBuffer);
		// 			chrome.downloads.download({
		// 					url: url
		// 			});
		// 			$("#download-label").html(chrome.i18n.getMessage("download"))
		// 		});
		// 	} else if ($("#format-select").val() == "gif") {
		// 			var superBuffer = new Blob(blobs, {
		// 					type: 'video/webm'
		// 			});
		// 			convertStreams(superBuffer, "gif");
		// 	} else if ($("#format-select").val() == "mp3") {
		// 		var superBuffer = new Blob(blobs, {
		// 				type: 'video/webm'
		// 		});
		// 		convertStreams(superBuffer, "mp3");
		// }
	}
	

	function processFile(file, public_id) {
		// var file = upload_file.files[0];
		slice_size = 99000000;
		var size = file.size;
		var start = 0;
	    x_unique_upload_id = +new Date();
		num_reqs = Math.ceil(size/slice_size);
		console.log("File size: ", size);
		console.log("Num requests: ", num_reqs);
		var email = document.getElementById('uemail').value;
		var participants = document.getElementById('pname').value;
		const metadata = "email="+email+"|participants="+participants;
		setTimeout(loop, 3);
	  
		function loop() {
		  var end = start + slice_size;
		  console.log("loop", start, end, slice_size);
	  
		  if (end > size) {
			end = size;
		  }
		  var s = slice(file, start, end);
		  send(s, start, end - 1, size, x_unique_upload_id, public_id, metadata);
		  if (end < size) {
			start += slice_size;
			setTimeout(loop, 3);
		  }
		}
	  }
	  
	  async function sha1(str) {
		const buffer = new TextEncoder("utf-8").encode(str);
		const hash = await crypto.subtle.digest('SHA-1', buffer)
		const hashArray = Array.from(new Uint8Array(hash));
		const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		return hashHex;
	  }

	  function send(piece, start, end, size, x_unique_upload_id, public_id, metadata) {
		console.log("start ", start);
		console.log("end", end);
		console.log("x_unique_upload_id", x_unique_upload_id);
		// upload_preset = "ejnxarbz";

		cloud_name = "era-jain";
		const currentDate = new Date();
		const timestamp = currentDate.getTime();

		var formdata = new FormData();
		formdata.append("file", piece);
		formdata.append("api_key", "865878173548655");
		// formdata.append("upload_preset", upload_preset);
		formdata.append("cloud_name", cloud_name);
		formdata.append("timestamp", timestamp);
		formdata.append("public_id", public_id);
		formdata.append("context", metadata);
		formdata.append("async", true);
		
		var xhr = new XMLHttpRequest();
		xhr.open(
		  "POST",
		  "https://api.cloudinary.com/v1_1/" +
			cloud_name +
			"/video/upload",
		  true
		);
		xhr.setRequestHeader("X-Unique-Upload-Id", x_unique_upload_id);
		xhr.setRequestHeader(
		  "Content-Range",
		  "bytes " + start + "-" + end + "/" + size
		);
	  
		xhr.onload = function () {
		  console.log("Response", this.responseText);
		//   link = jsonResponse["url"];
		//   console.log(jsonResponse["url"]);
		//   links.push(link);
		};
		let payload = "async=true&context="+metadata+"&public_id="+public_id+"&timestamp="+timestamp+"V6nUJWezQVnzCnx7yR0c3I5wSRY";
		let signature = "";
		sha1(payload).then(digestHex => {
			signature=digestHex;
			formdata.append("signature", signature);
			xhr.send(formdata);
			sent_reqs = sent_reqs + 1;
			var width = Math.ceil((sent_reqs*100)/num_reqs);
		    document.getElementById("uploadBar").style.width = width + '%';
			if (sent_reqs == num_reqs) {
				console.log("File sent");
				// window.open('../html/success.html', "_self");
			}
		});
	  }
	  
	  function slice(file, start, end) {
		var slice = file.mozSlice
		  ? file.mozSlice
		  : file.webkitSlice
		  ? file.webkitSlice
		  : file.slice
		  ? file.slice
		  : noop;
	  
		return slice.bind(file)(start, end);
	  }
	  
	function sendToAirtable(email, meeting_name, participants) {
		if (num_reqs == -1 || num_reqs == 0) {
			console.log("Error with file size and slice size");
			return;
		}
		if (res.length >= num_reqs) {
			var link = "";
			for (let i=0; i<res.length; i++) {
				var jsonResponse = res[i];
				if (jsonResponse.hasOwnProperty("url")) {
					link = jsonResponse["url"];
				}
			}
			if (link == "") {
				console.log("Bad link, cannot post to Airtable.");
				return;
			}
			console.log("link", link);
			var status = 'Todo'
			var email = document.getElementById('uemail').value;
			var meeting_name = document.getElementById('mname').value;
			var participants = document.getElementById('pname').value;
			console.log('email: ', email);
			console.log('name: ', meeting_name);
			console.log('participants: ', participants);
			var records = {
				"User Email": email,
				"Meeting Name": meeting_name,
				"Meeting Participants": participants,
				"Meeting Recording": [
					{
						"url": link,
					}
				],
				"Status": status
			}

			var myHeaders = new Headers();
			myHeaders.append("Content-Type", "application/json");
			var requestOptions = {
				method: "post",
				headers: myHeaders,
				redirect: "follow",
				body: JSON.stringify([records])
			};

			fetch("https://v1.nocodeapi.com/erry19/airtable/mWakKYYOblnXsXCb?tableName=Raw Meeting Data", requestOptions)
			.then(response => response.text())
			.then(result => {
				console.log(result)
				// window.open('../html/success.html', "_self");
			})
			.catch(error => console.log('error', error));
		} else {
		  setTimeout(sendToAirtable, 100);
		}
	}

	function sendToS3(file, objKey) {
		AWS.config.region = 'us-east-1';
		AWS.config.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: 'us-east-1:388253a8-18b1-454e-99a1-cff512c494ef'
		});
		AWS.config.credentials.get(function(err) {
			if (err) alert(err);
			console.log(AWS.config.credentials);
		});

		var bucketName = 'di-pilot-data/*';
		var meeting_type = $("#meeting-type-select").val();
		var email = document.getElementById('uemail').value;
		var participants = document.getElementById('pname').value;
		var request = new AWS.S3.ManagedUpload({
			partSize: 50 * 1024 * 1024,
			queueSize: 4,
			params: {
				Bucket: bucketName,
				Key: objKey + '.webm',
				ContentType: 'video/webm',
				Body: file,
				Metadata: {Email: email, Participants: participants, Meeting_Type: meeting_type},
			}
		});
		request.on('httpUploadProgress', function (progress) {
			document.getElementById("uploadBar").style.width = parseInt((progress.loaded * 100) / progress.total) + '%';
			console.log("Uploaded :: " + parseInt((progress.loaded * 100) / progress.total)+'%');
		   // console.log(progress.loaded + " of " + progress.total + " bytes");
		}).send(function(err, data){
			if(err) {
				console.log(err, err.stack);
			} else {
				console.log("File has been uploaded successfully.");
				window.open('../html/success.html', "_self");
			}
		});
	}

	// Save to DeepInsights' S3 bucket
	function saveVideo() {
		downloaded = true;
		var email = document.getElementById('uemail').value;
		var meeting_name = document.getElementById('mname').value;
		var participants = document.getElementById('pname').value;
		if(email=="" || meeting_name=="" || participants==""){
			alert("Please fill out the email address, meeting name, and participants fields");
		} else {
		$("#share span").html(chrome.i18n.getMessage("saving"));
		$("#share").css("pointer-events", "none");
		// $('#background').addClass('uploadBackground');
		document.getElementById("content").style.display = "none";
		document.getElementById("export").style.display = "none";
		document.getElementById("settings").style.display = "none";
		document.getElementById("navigation").style.display = "none";
		document.getElementById("uploadProgress").style.display = "block";
		var elem = document.getElementById("uploadBar");   
		elem.style.width = '1%'; 
		ysFixWebmDuration(blobs, blobs.length, function(fixedBlob) {
			var superBuffer = new Blob(fixedBlob, {
				type: 'video/webm'
			});
			// audio = convertStreams(superBuffer, "mp3");
			var videoFile = new File([superBuffer], 'video.webm', { type: 'video/webm' });
			sendToS3(videoFile, meeting_name);
			// processFile(videoFile, meeting_name);
			// sendToAirtable();
			// console.log('link: ', link);
			// const bodyfileio = new FormData();
       		// bodyfileio.append("file", videoFile);
			// bodyfileio.append("upload_preset", "ejnxarbz");
			// console.log("Uploading file...");
			// const API_ENDPOINT = "https://api.cloudinary.com/v1_1/era-jain/video/upload";
            // const request = new XMLHttpRequest();
            // request.open("POST", API_ENDPOINT, true);
			//request.setRequestHeader("Authorization", "Client-ID 2d081b89f5821fd");
			//request.setRequestHeader("Content-Type", "multipart/form-data");
            // request.onreadystatechange = () => {
				// if (request.readyState === 4 && request.status === 200) {
				// 	console.log(request.responseText);
				// 	var jsonResponse = JSON.parse(request.responseText);
				// 	link = jsonResponse["url"];
				// 	console.log(jsonResponse["url"]);
				
					//var email = document.getElementById('uemail').value;
			
					//var meeting_name = document.getElementById('mname').value;
			
					// var participants = document.getElementById('pname').value;
				// } else {
				// 	console.log(request);
		    	// }
			// };
			// request.send(bodyfileio);
	    });
		// fetch("https://file.io", {
		// 	bodyfileio,
		// 	headers: {
		// 		"Content-Type": "multipart/form-data"
		// 	}
		// })
		// .then(response => response.json())
		// .then(result => console.log(result))
		// .catch(error => console.log('error', error));

		$("#share span").html("Thank you!");
		$("#share").css("pointer-events", "none");
	}
		//var form = new FormData();
		// form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
		// form.append('User Email', email);
		// form.append('Meeting Name', meeting_name);
		// form.append('Meeting Participants', participants);
		// form.append('Meeting Recording', [JSON.stringify(meeting_recording)]);
		// form.append('Status', status);

		// Upload to Airtable
		// var xhr = new XMLHttpRequest();
		// // xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
		// xhr.open('POST','https://api.airtable.com/v0/apphWtvYFe4OVmJP6/Raw%20Meeting%20Data');
		// xhr.setRequestHeader('Authorization', 'Bearer ' + token);
		// xhr.setRequestHeader('Content-Type', 'application/json');
		// xhr.responseType = 'json';
		// xhr.onload = () => {
		// 	alert(JSON.stringify(xhr.response))
		// 	console.log(JSON.stringify(xhr.response))
		// 	if (xhr.status != 200) { // analyze HTTP status of the response
		// 		alert(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
		// 	} else { // show the result
		// 		alert(`Done, got ${xhr.response.length} bytes`); // response is the server response
		// 		$("#share span").html("Thank you!");
		// 	    $("#share").css("pointer-events", "all");
		//      }
			// var fileId = xhr.response.id;			
			// Open file in Drive in a new tab
			// chrome.tabs.create({
			// 		 url: "https://drive.google.com/file/d/"+fileId
			// });
		//};
		// xhr.onerror = () => {
		// 	alert("Request failed");
		// };
        // var Airtable = require('airtable');
        // var base = new Airtable({apiKey: token}).base('apphWtvYFe4OVmJP6');
		// base('Raw Meeting Data').create({
		// 	"User Email": email,
		// 	"Meeting Name": meeting_name,
		// 	"Meeting Participants": participants,
		// 	"Meeting Recording": [{
		// 		"url": url
		// 	}],
		// 	"Status": status
		// }, function(err, record) {
		// 	if (err) {
		// 		console.error(err);
		// 		return;
		// 	}
		// 	console.log(record.getId());
		// });
		//response=xhr.send(form);
	}
	
	// Check when video has been loaded
	$("#video").on("loadedmetadata", function(){

			// Initialize custom video player
			player = new Plyr('#video', {
					controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
					ratio: '16:9'
			});
			
			// Check when player is ready
			player.on("canplay", function(){
					// First time setup
					if (setup) {
							setup = false;
							initRanges();
							player.currentTime = 0;
					}
					
					// Check when trim slider values change
					trimslider.noUiSlider.on('slide', function(values, handle) {
							$("#trim-start input").val(timestamp(0));
							$("#trim-end input").val(timestamp(values[0]));
							player.currentTime = parseFloat(values[handle]);
					});
					
					// Check when remove slider values change
					removeslider.noUiSlider.on('slide', function(values, handle) {
							$("#remove-start input").val(timestamp(values[0]));
							$("#remove-end input").val(timestamp(values[1]));
							player.currentTime = parseFloat(values[handle]);
					});
					
			});
	})


	// Applying a trim
	$("#apply-trim").on("click", function(){
			trim(0, parseInt(trimslider.noUiSlider.get()[0]));
	});
	
	// Removing part of the video
	$("#apply-remove").on("click", function(){
			remove(parseInt(removeslider.noUiSlider.get()[0]), parseInt(removeslider.noUiSlider.get()[1]));
	});
	
	// Download video
	$("#download").on("click", function(){
			download();
	});
	
	// Save to Airtable
	$("#share").on("click", function(){
		saveVideo();
	});
	
	// Revert changes made to the video
	$("#reset").on("click", function(){
			reset();
	});
	
	// For mobile version
	$("#show-hide").on("click", function(){
			$("#settings").toggleClass("hidepanel");
			$("#export").toggleClass("hidepanel");
	}) ;
	
	// Localization (strings in different languages)
	$("#made-with").html(chrome.i18n.getMessage("made_with"));
	$("#rate-label").html(chrome.i18n.getMessage("rate_extension"));
	$("#show-hide").html(chrome.i18n.getMessage("show_hide"));
	$("#edit-label").html(chrome.i18n.getMessage("edit_recording"));
	// $("#format-select-label").html(chrome.i18n.getMessage("format"));
	$("#webm-default").html(chrome.i18n.getMessage("webm"));
	$("#email-label").html(chrome.i18n.getMessage("user_email"));
	$("#name-label").html(chrome.i18n.getMessage("meeting_name"));
	$(".start-label").html(chrome.i18n.getMessage("start"));
	$(".end-label").html(chrome.i18n.getMessage("end"));
	$("#apply-trim").html(chrome.i18n.getMessage("apply"));
	$("#participants-label").html(chrome.i18n.getMessage("meeting_participants"));
	// $("#format-select-label").html(chrome.i18n.getMessage("format"));
	$("#apply-remove").html(chrome.i18n.getMessage("apply"));
	$("#reset").html(chrome.i18n.getMessage("reset"));
	$("#download-label").html(chrome.i18n.getMessage("download"));
	$("#share span").html(chrome.i18n.getMessage("save_drive"));
	$("#apply-trim").html(chrome.i18n.getMessage("apply"));
});
