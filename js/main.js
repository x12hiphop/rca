$(function() {
	app.init();
});

var app = {

	itemSelector: '.page div.item.clickable',
	backButton: '.header .back',
	headerSelector: '.header span:not(.back)',
	pageSelector: '.page',
	pageContainer: '#pages',

	cycle: 0,
	selected: '',
	texts: [],
	animating: false,
	origin: [],

	current: {
		coreTask: 1,
		workProces: 1,
		competention: 1
	},

	edu: {
		totalLevels: 0
	},

	local: false,

	getEducation: function() {
		if (localStorage.education) {
			app.local = true;
			return localStorage.getItem('education');
		} else {
			localStorage.setItem('education', education);
			return education;
		}

	},

	init: function() {

		if (!localStorage) {
			alert('Deze app kan niet worden gebruikt zonder localStorage.');
			return;
		}

		education = app.getEducation();
		app.make(education);

		$('#pages').delegate(app.itemSelector, 'click', function() {
			if (app.animating)
				return false;

			var itemContainer = $(this).parents('div.page');
			var width = itemContainer.width();
			var text = $(this).text();

			app.animating = true;

			itemContainer.animate({
				marginLeft: '-'+width+'px'
			}, 300);

			app.selected = itemContainer.next();
			app.texts.push($(app.headerSelector).text());

			$(app.headerSelector).fadeOut(200).promise().done(function() {
				$(this).text(text).fadeIn(200);
				app.animating = false;
			});
			app.cycle += 1;
		});

		$(app.backButton).on('click', function() {
			if (app.cycle === 0 || app.animating)
				return false;
			app.animating = true;
			var previous = app.selected.prev();
			app.selected = previous;
			previous.animate({
				marginLeft: 0
			}, 200);
			app.cycle -= 1;

			$(app.pageSelector).last().remove();

			$(app.headerSelector).fadeOut(200).promise().done(function() {
				$(this).text(app.texts[app.cycle]).fadeIn(200).promise().done(function() {
					if (app.cycle === 0)
						app.texts = [];
					app.animating = false;
					app.origin.pop();
				});
			});
		});
	},

	make: function(json) {
		app.edu = $.parseJSON(json);

		if (app.local === false) //Bereken alleen maar wanneer de opleiding niet lokaal staat.
			app.calculateCompletion();

		var newPage = $('<div />').attr('class', 'page');
		var html = app.generatePageHTML(app.edu.CoreTasks);
		newPage.html(html);

		$(app.pageContainer).append(newPage);
		app.selected = newPage;

		newPage.children().on('click', function() {
			app.origin.push($(this));
			app.current.coreTask = $(this).attr('data-id');
			app.generateWorkProcesses(app.edu.CoreTasks[$(this).attr('data-id')].workProcesses);
		});
	},

	calculateCompletion: function() {
		var education = app.edu.CoreTasks;
		var lvls = 0;

		for (coreTask in education) {
			var currentCoreTask = education[coreTask];
			var workProcesses = currentCoreTask.workProcesses;
			var totalLevels = 0;
			var totalLevelsDone = 0;

			for (workProcess in workProcesses) {
				var currentWorkProcess = workProcesses[workProcess];
				var competentions = currentWorkProcess.competentions;
				var totalWpLevels = 0;
				var totalWpLevelsDone = 0;

				for (competention in competentions) {
					var currentCompetention = competentions[competention];
					var levels = app.getCompCompletion(currentCompetention.complete);
					totalWpLevels += levels.total;
					totalWpLevelsDone += levels.done;
					currentCompetention.classNameState = levels.donePercent/100;
					currentCompetention.completed = (Math.round(levels.donePercent/10));
				}

				currentWorkProcess.classNameState = (totalWpLevelsDone/totalWpLevels);
				currentWorkProcess.completed = (Math.round(currentWorkProcess.classNameState*10));

				totalLevels += totalWpLevels;
				totalLevelsDone += totalWpLevelsDone;
			}

			lvls += totalLevels;
			currentCoreTask.classNameState = (totalLevelsDone/totalLevels);
			currentCoreTask.completed = (Math.round(currentCoreTask.classNameState*10));
		}

		app.edu.totalLevels = lvls;
		app.save();
		//return;
	},

	//Functie moet nog bijgewerkt worden.
	repaint: function() {
		//d.m.v. app.cycle en app.origin de elementen iteraten.
		//Hier nieuwe classes aan toevoegen d.m.v. gebruiken app.current.[<--!-->]
		var eCoreTask = app.origin[0];
		var eWorkProces = app.origin[1];
		var eCompetention = app.origin[2];

		var oCoreTask = app.edu.CoreTasks[app.current.coreTask];
		var oWorkProces = oCoreTask.workProcesses[app.current.workProces];
		var oCompetention = oWorkProces.competentions[app.current.competention];

		eCoreTask
			.removeClass('p1 p2 p3 p4 p5 p6 p7 p8 p9 p10')
			.addClass('p'+oCoreTask.completed)
			.children('div').css({
				width: Math.round(oCoreTask.classNameState*100)+'%'
			});
		eWorkProces
			.removeClass('p1 p2 p3 p4 p5 p6 p7 p8 p9 p10')
			.addClass('p'+oWorkProces.completed)
			.children('div').css({
				width: Math.round(oWorkProces.classNameState*100)+'%'
			});
		eCompetention
			.removeClass('p1 p2 p3 p4 p5 p6 p7 p8 p9 p10')
			.addClass('p'+oCompetention.completed)
			.children('div').css({
				width: Math.round(oCompetention.classNameState*100)+'%'
			});

	},

	//Opslaan.
	save: function() {
		localStorage.setItem('education', JSON.stringify(app.edu));
	},

	getCompCompletion: function(obj) {
		var i = 0;
		var complete = 0;
		var retObj = {};

		for (key in obj) {
			i++;
			if (obj[key] == 1)
				complete++;
		}

		retObj.donePercent = Math.round((complete/i)*100);
		retObj.total = i;
		retObj.done = complete;

		return retObj;

	},

	generateWorkProcesses: function(obj) {
		var html = app.generatePageHTML(obj);
		var newPage = $('<div />').attr('class', 'page');
		newPage.html(html);

		$(app.pageContainer).append(newPage);
		app.selected = newPage;

		newPage.children().on('click', function() {
			app.origin.push($(this));
			app.current.workProces = $(this).attr('data-id');
			app.generateCompetentions(obj[$(this).attr('data-id')].competentions);
		});
	},

	generateCompetentions: function(obj) {
		var html = app.generatePageHTML(obj);
		var newPage = $('<div />').attr('class', 'page');
		newPage.html(html);

		$(app.pageContainer).append(newPage);
		app.selected = newPage;

		newPage.children().on('click', function() {
			app.origin.push($(this));
			app.current.competention = $(this).attr('data-id');
			app.generateLevels(obj[$(this).attr('data-id')]);
		});
	},

	generateLevels: function(obj) {
		var html = app.getLevels(obj);
		var newPage = $('<div />').attr('class', 'page');
		newPage.html(html);

		$(app.pageContainer).append(newPage);
		app.selected = newPage;
		newPage.find('.level').click(function() {
			var newChildren = newPage.children();

			if ($(this).hasClass('p10')) { //geklikt, maar heeft de competentie al.
				for (var i = $(this).attr('data-id'); i <= ($('.level').length-1); i++)
					if ($(newChildren[i]).hasClass('p10')) {
						$(newChildren[i]).removeClass('p10');
						app.unsetLevelComplete(i);
					}
			} else {
				for (var i = 0; i <= $(this).attr('data-id'); i++)
					if (!$(newChildren[i]).hasClass('p10')) {
						$(newChildren[i]).addClass('p10');
						app.setLevelComplete(i);
					}
			}

			app.calculateCompletion();
			app.repaint();
			app.save();
		});
	},

	setLevelComplete: function(i) {
		var oLevel = app.edu.CoreTasks[app.current.coreTask].workProcesses[app.current.workProces].competentions[app.current.competention];
		//oLevel.complete[i] = 1;
		while (i >= 0) {
			oLevel.complete[i] = 1;
			i--
		}
	},

	unsetLevelComplete: function(i) {
		var oLevel = app.edu.CoreTasks[app.current.coreTask].workProcesses[app.current.workProces].competentions[app.current.competention];
		//oLevel.complete[i] = 0;/
		while (i >= 0) {
			oLevel.complete[i] = 0;
			i--
		}
	},

	getLevels: function(obj) {
		var HTML = '';

		for (key in obj.complete) {
			var keyName = 'B';

			switch (key) {
				case '1':
					keyName = 'G';
				break;

				case '2':
					keyName = 'BB';
				break;
			}

			console.log(obj.complete[key]);

			HTML += '<div data-id="'+key+'" class="item'+(obj.complete[key] == 1 ? ' p10' : '')+' level">';
			HTML += '<div></div><span>'+keyName+'</span>';
			HTML += '</div>';
		}

		return HTML;
	},

	generatePageHTML: function(obj, notClickable) {
		var HTML = '';

		for (key in obj) {
			HTML += '<div data-id="'+key+'" class="item'+(notClickable ? '' : ' clickable')+('completed' in obj[key] ? ' done p'+obj[key].completed : '')+'">';
			HTML += '<div '+('classNameState' in obj[key] ? 'style="width: '+(Math.round(obj[key].classNameState*100))+'%;"' : '')+'></div><span>'+obj[key].name+'</span>';
			HTML += '</div>';
		}

		return HTML;
	}
}