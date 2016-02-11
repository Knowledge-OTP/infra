angular.module( 'znk.infra.general' )
	.directive( 'videoCtrlDrv' , [ '$interpolate' , '$window' , function ( $interpolate , $window )
	{
		return {

			link: function ( scope , element , attrs , ctrl ){

				//var vidElm=element[0 ].children[0];
				var vidElm=element[0 ];
				var sources                = vidElm.querySelectorAll( 'source' );

				if ( sources.length !== 0 )
				{
					lastSource = sources[ sources.length - 1 ];

					lastSource.addEventListener( 'error' , function ( ev )
					{

						element.replaceWith( '<div class="video_not_available" ></div>');
					} );
					vidElm.addEventListener( 'loadeddata' , function ( ev )
					{
						this.style.visibility= 'visible';
						/*this.poster =
							'http://corrupt-system.de/assets/media/sintel/sintel-trailer.jpg';*/
					} );

				}
			}
		};
	} ] );
