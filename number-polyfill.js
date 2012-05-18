
window.addEvent('domready', function(){
	if( new Element('input[type=number]').type == 'text' ) {
		var numbers = $$('input[type=number]');
		numbers.addEvent('keydown', function(e){
			var val = parseFloat(this.value, 10);
			if( e.key == 'up' ) {
				this.value++;
				e.stop();
			}else if( e.key == 'down' ) {
				this.value--;
				e.stop();
			}
		});

		numbers.each(function(e,i){
			console.log(e);
		});
	}
});