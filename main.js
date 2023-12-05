console.log('HELLO FUCKERS');



const fs   = require('fs');
const http = require('http');

const allowedFiles = [
	'/logo.png',
	'/favicon.ico',
	'/test.txt',
	'/xmas.css',
	'/markdownInfo.htm'
];

const bannedIPs = [];

var primePosts = JSON.parse(fs.readFileSync('posts.json')).primePosts;
var underlinedNames = JSON.parse(fs.readFileSync('posts.json')).underlinedNames;

function getRandomPostId() {
	let posts = JSON.parse(fs.readFileSync('posts.json')).posts;

	let f = ()=>{
		return posts[Math.floor(Math.random() * posts.length)];
	};

	let post = f();
	let done = post.id;


	// Make sure it has an ID and is NOT a reply
	while (!done && post.parentId == undefined) {
		post = f();
		done = post.id;
	};

	return done;
};

function sanitizeString(str,doMarkdown) {
	let done = str;

	done = done.replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/\/n/g,'<br>');

	if (doMarkdown) {
		replaceTable = [
			[/~i/g,'<i>'],
			[/~\/i/g,'</i>'],
			[/~b/g,'<b>'],
			[/~\/b/g,'</b>'],
			[/~u/g,'<u>'],
			[/~\/u/g,'</u>'],
			[/~s/g,'<strike>'],
			[/~\/s/g,'</strike>'],
			[/~h/g,'<h1>'],
			[/~\/h/g,'</h1>']
		];

		replaceTable.forEach((i)=>{
			done = done.replace(i[0],i[1]);
		});

		done += '</i></b></u></strike></h1>'
	};

	return done;
};

function parsePost(post,individualPage) {

	post.name = sanitizeString(post.name);
	post.content = sanitizeString(post.content,true);

	let done = '';
	
	// Underline special names
	if (underlinedNames.includes(post.name)) {
		post.name = '<u title="This person has an underline because they made a suggestion for the site that was implemented">' + post.name + '</u>';
	};
	

	// Make my name cool :)
	post.name == "Owen" ? post.name = '<span style="color:#d0f;font-weight:bold" title="Owen made the site, I think he deserves a cool looking name">Owen</span>' : '';


	done += '<fieldset';

	// If post is prime, make it light blue
	if (primePosts.includes(post.id)) {
		done += ' style="background-color:#9ef;border-width:8px"';
	} else { // Else, just make it gray
		done += ' style="background-color:#eee"';
	};

	done += '><legend>' + post.name + '</legend>';

	// Prime post explanation
	primePosts.includes(post.id) ? done += '<span style="font-size:12px;color:#068">This is a prime post. That means Owen particualrly favors it. If you posted this, congrats.</span><br><br>' : '';
	
	done += post.content + '<br>';
	
	post.image ? done += '<a href="' + post.image + '" target="_blank"><img style="max-width:500px" alt="Post image" src="' + post.image + '" /></a>' : '';
	
	let randDateID = Math.floor(Math.random() * 2**48);
	done += '<br><br><i style="color:gray">Posted <span id="' + randDateID + '"></span></i><script>document.getElementById(' + randDateID + ').innerHTML = (new Date(' + post.time + ')).toString()</script>';
	if (post.id) {
		done += '<br><i style="color:gray;font-size:12px">ID: ' + post.id + '</i>';
		individualPage||!post.replyIdList?'':done += '<br><a href="viewPost' + post.id + '"><button>See replies (' + post.replyIdList.length + ')</button></a>';
	};
	done += '</fieldset>';
	return done;
};

function getAllPosts(pageNumber,postsPerPage) {
	let rawData = fs.readFileSync('posts.json','utf8');
	data = JSON.parse(rawData);

	let script = () => {
		let autoReloadCheckbox = document.getElementById('autoReload');

		document.cookie.includes('autoReload=true') ? autoReloadCheckbox.checked = true : autoReloadCheckbox.checked = false;

		autoReloadCheckbox.addEventListener('change',()=>{
			document.cookie = 'autoReload=' + autoReloadCheckbox.checked;
		});
		setInterval(()=>{
			if (document.cookie.includes('autoReload=true')) {
				location.reload();
			};
		},10000);
	};

	let done = '<a href="/"><img width="32" style="image-rendering:pixelated" src="/logo.png" alt="Logo: A Minecraft bucket full of septic fluid" /></a><style>img {max-width:500px}</style><meta charset="utf-16" /><a href="post"><button>Make a post</button></a><a href="viewPost' + getRandomPostId() + '"><button>Random Post</button></a><input id="autoReload" type="checkbox" />Auto-reload (uses cookies)<a href="info"><button>See site statistics</button></a><script>(' + script + ')()</script><br>';

	// Christmas
	let date = new Date();
	if (date.getMonth() == 11 && date.getDate() == 25) {
		done += '<link href="xmas.css" rel="stylesheet">';
	};


	data.posts.forEach((post)=>{
		if (!post.parentId)
			done += parsePost(post,false);
	});

	return done;
}




let server = http.createServer((request,response)=>{
	response.statusCode = 200;
	response.setHeader('Content-Type','text/HTML');

	console.log('REQUEST  | ' + request.url);

	fs.appendFileSync('log.txt','IP=' + request.connection.remoteAddress + ';TIME=' + (new Date().toString()) + ';URL=' + request.url + '\n')

	if (bannedIPs.includes(request.connection.remoteAddress)) {
		response.end('ur ip is banned lmao','plain/text');
		return;
	};

	switch (request.url) {
		case '/':
			response.end(fs.readFileSync('main.html','utf8'));
			break;
		default:
			let strings = {
				makePost:'/makePost',
				viewPost:'/viewPost',
				post:'/post',
				info:'/info',
				stream:'/stream'
			};


			  ///////////////
			 // MAKE POST //
			///////////////

			if (request.url.substring(0,strings.makePost.length) == strings.makePost) {
				
				// Get datas
			 	let post = JSON.parse(decodeURI(request.url.substring(strings.makePost.length)));
				let data = JSON.parse(fs.readFileSync('posts.json'));
				

				// Apply some stuff to the post beforehand
				post.time = (new Date()).getTime();
				post.id   = Math.floor(Math.random() * 2**48);
				post.replyIdList = [];

				// If it's a reply...
				if (post.parentId || post.parentId === 0) {
					// Find the post it's replying to
					data.posts.forEach((parentPost,index)=>{
						if (parentPost.id === post.parentId) {

							// Tell this post that it has a reply
							data.posts[index].replyIdList.unshift(post.id);

						};
					})
				};

				console.log('POSTDATA |' + post);
				data.posts.unshift(post);

				fs.writeFileSync('posts.json',JSON.stringify(data));
			};


			  ///////////////
			 // VIEW POST //
			///////////////

			if (request.url.substring(0,strings.viewPost.length) == strings.viewPost) {
				
				// Gettey datas
				let id = (request.url.substring(strings.viewPost.length));
				let data = JSON.parse(fs.readFileSync('posts.json'));

				let done = '<meta charset="utf-16">';

				// Find the post
				let me = '';
				data.posts.forEach((post)=>{
					if (id == post.id) {
						done += parsePost(post,true);
						me = post;
					};
				});

				// Do back button
				if (me.parentId == 0 || me.parentId) {
					done = '<a href="/viewPost' + me.parentId + '"><button>Go back</button></a>' + done;
				} else {
					done = '<a href="/stream"><button>Go back</button></a>' + done;
				};

				// Sam's <hr>
				done += '<br><hr><br>';


				// Do reply button
				done += '<a href="/post' + me.id + '"><button>Write reply</button></a>'


				// Find its replies
				data.posts.slice().reverse().forEach((post)=>{
					if (me.replyIdList.includes(post.id)) {
						done += parsePost(post,false);
					};
				});


				response.end(done);
			};





			  ////////////////////
			 // MAKE POST PAGE //
			////////////////////
			
			if (request.url.substring(0,strings.post.length) == strings.post) {
				let html = fs.readFileSync('post.html','utf8');
				html = html.replace('REPLACEME',request.url.substring(strings.post.length));
				response.end(html);
			};





			  ////////////
			 // STREAM //
			////////////

			if (request.url.substring(0,strings.stream.length) == strings.stream) {
				let pageNumber = (request.url.substring(strings.stream.length));
				const postsPerPage = 50;

				let done = getAllPosts(0,50);

				response.end(done);
			};





			  ////////////////
			 // STATISTICS //
			////////////////

			if (request.url.substring(0,strings.info.length) == strings.info) {

				let data = JSON.parse(fs.readFileSync('posts.json'));

				let profanity = [
					'shit',
					'nigger',
					'nigga',
					'negro',
					'fag',
					'faggot',
					'ass',
					'fuck',
					'damn',
					'cock',
					'cum',
					'jizz',
					'tit',
					'titty',
					'titties',
					'tits',
					'whore'
				];

				let numPosts = 0;
				let numReplies = 0;
				let numPostsAndReplies = 0;
				let numPostsWithProfanity = 0;

				let nameList = [];


				// Run through posts to colloect info
				data.posts.forEach((post)=>{
					post.parentId==undefined ? numPosts++ : numReplies++;

					numPostsAndReplies++;

					let nameSanitized = post.name.toLowerCase();

					!nameList.includes(nameSanitized) ? nameList.push(nameSanitized) : '';

					let profane = false;
					profanity.forEach((word)=>{
						if (post.content.toLowerCase().includes(word + ' ') || post.content.toLowerCase().includes(word + '.') || post.content.toLowerCase().includes(word + '!') || post.content.toLowerCase().includes(word + '?') || post.content.toLowerCase().includes(' ' + word)) {
							profane = true;
						};
					});

					profane ? numPostsWithProfanity++ : '';
				});

				let daysSinceBeginning = (new Date().getTime() - 1637858124847)  / (1000 * 60 * 60 * 24);
				let numPostsPerDay = numPostsAndReplies / daysSinceBeginning;

				let done = '<style>tr:nth-child(odd){background-color:#aaa;}</style><a href="/stream"><button>See stream</button></a><table>\
				<tr><td>Number of posts</td><td>' + numPosts + '</td></tr>\
				<tr><td>Number of posts &amp; replies</td><td>' + numPostsAndReplies + '</td></tr>\
				<tr><td>Number of posts &amp; replies with profanity (my filter isn\'t perfect)</td><td>' + numPostsWithProfanity + ' </td></tr>\
				<tr><td>Average number of posts &amp; replies per day</td><td>' + numPostsPerDay + '</td></tr>\
				<tr><td>Number of people with underlined names</td><td>' + data.underlinedNames.length +  '</td></tr>\
				<tr><td>Number of unique names</td><td>' + nameList.length + '</td></tr>\
				<tr><td>Number of prime posts</td><td>' + data.primePosts.length + '</td></tr>\
				</table>\
				';


				response.end(done);
			};



			  ///////////////////
			 // ALLOWED FILES //
			///////////////////
			if (allowedFiles.includes(request.url)) {
				let ext = {
					'png':'image/png',
					'ico':'image/x-icon',
					'txt':'text/plain',
					'css':'text/css',
					'htm':'text/HTML'
				};

				response.writeHead(200,{'Content-Type':ext[request.url.substr(-3)]});
				response.end(fs.readFileSync(request.url.substr(1)));
			};


			break;
	}
});


server.listen(80);
