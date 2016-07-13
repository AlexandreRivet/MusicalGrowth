var ResourceType = {
	UNKNOWN: 	0,
	IMAGE: 		1,
	MUSIC: 		2,
	OBJ: 		3
};

var ResourceManager = {
	begin: function() {
	
		this.resources = new Array();
		this.onloadCallback = null;
		this.finishedCallback = null;
		this.onprogressCallback = null;
		this.nbLoaded = 0;
		
	},
	
	addResource: function(name, url, type, onprogress, onload) {
		
		this.resources.push({
			'name' : name,
			'url' : url,
			'type' : type,
			'onprogress': onprogress,
			'onload': onload
		});
		
	},
	
	run: function(onprogress, onload, finished) {
	
		this.onprogressCallback = onprogress;
		this.onloadCallback = onload;
		this.finishedCallback = finished;
	
		if (this.resources.length > 0)
			this.loadResource(this.resources[0]);
		
	},
		
	loadResource: function(resource) {
	
		var self = this;
		
		switch(resource.type) {
		
			case ResourceType.UNKNOWN:
				break;
			case ResourceType.IMAGE:
				break;
			case ResourceType.MUSIC:
				AudioManager.loadSound(
					resource.name, 
					resource.url, 
					function(percent) { 
						if (resource.onprogress)						
							resource.onprogress(percent); 
						self.notifyProgress(percent); 
					}, 
					function() { 
						if (resource.onload)						
							resource.onload(); 
						self.notifyLoad(); 
					}
				);
				break;
			case ResourceType.OBJ:
				break;
		}
		
	},
	
	notifyProgress: function(percentCurrent) {
	
		var percent_per_resource = 1.0 / this.resources.length;
		var percent_alreadyLoaded = this.nbLoaded * percent_per_resource;
		var finalPercent = percent_alreadyLoaded + percentCurrent * percent_per_resource;
		
		if (this.onprogressCallback)
			this.onprogressCallback(finalPercent);
		
	},
		
	notifyLoad: function() {
	
		this.nbLoaded++;

		if (this.onloadCallback)
			this.onloadCallback(this.nbLoaded / this.resources.length);
		
		if (this.nbLoaded == this.resources.length) {
			
			if (this.finishedCallback)
				this.finishedCallback();
			
			this.resources = new Array();
			this.onloadCallback = null;
			this.finishedCallback = null;
			this.onprogressCallback = null;
			this.nbLoaded = 0;
			
			
		} else {
		
			this.loadResource(this.resources[this.nbLoaded]);
			
		}
		
	}
	
	
};