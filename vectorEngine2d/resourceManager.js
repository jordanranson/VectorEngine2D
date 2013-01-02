var ResourceManager = function(contentPath) {
    this.contentPath = contentPath;
	this.images = {};
	this.audio = {};
};

// Load resource from URL
ResourceManager.prototype.load = function(url, resourceName, resourceType) {
    if(resourceType == ResourceType.image) {
        resources = this.images;
    }
    
    // Check to see if resource has already been loaded
    for (var prop in resources) {
        if(prop == resourceName) { return; }
    }
    
    var resource;
    if(resourceType == ResourceType.image) {
        resource = new Image();
        resource.onload = function() {
            resources[resourceName] = resource;
        };
        resource.src = this.contentPath + url;
    }
    if(resourceType == ResourceType.audio) {
        resource = new Image();
        resource.onload = function() {
            resources[resourceName] = resource;
        };
        resource.src = this.contentPath + url;
    }
};