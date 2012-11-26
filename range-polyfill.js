
window.addEvent('domready', function(){
	if( new Element('input[type=range]').type == 'text') {
		$$('input[type=range]').each(function(e){
			var min  = parseFloat(e.get('min' ))  || 0;
			var max  = parseFloat(e.get('max' ))  || 100;
			var step = parseFloat(e.get('step')) || 1;
			var scale = parseFloat(e.get('data-poly-scale')) || 1;
			var selected = e.get('value') || min;

			var select = new Element('select', {
				'id'   : e.get('id'),
				'class': e.get('class')
			});
			select.cloneEvents(e);

			for(var i = min; i <= max; i += step ) {
				var option = new Element('option', {
					'html'    : ((i * scale) + "").substring(0,3), //JavaScript sucks at numbers
					'value'   : i,
					'selected': i == selected ? 'selected' : ''
				});
				select.adopt(option);
			}

			select.replaces(e);
		});
	}
});