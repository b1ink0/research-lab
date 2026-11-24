<?php
// Usage: php gen.php <dir>. Makes the 1200x630 share images, labelled with their format.
// The transparent variants have a fully transparent background.
$out = $argv[1];
foreach ( array( false, true ) as $transparent ) {
	$im = imagecreatetruecolor( 1200, 630 );
	imagealphablending( $im, false );
	imagesavealpha( $im, true );
	imagefill( $im, 0, 0, $transparent ? imagecolorallocatealpha( $im, 0, 0, 0, 127 ) : imagecolorallocate( $im, 30, 90, 160 ) );
	imagealphablending( $im, true );
	imagefilledellipse( $im, 600, 315, 520, 520, imagecolorallocate( $im, 250, 190, 30 ) );
	foreach ( array( 'jpg', 'png', 'webp', 'avif' ) as $ext ) {
		if ( $transparent && 'jpg' === $ext ) {
			continue;
		}
		$label = strtoupper( $ext ) . ( $transparent ? ' TRANSPARENT' : '' );
		$copy  = imagecreatetruecolor( 1200, 630 );
		imagealphablending( $copy, false );
		imagesavealpha( $copy, true );
		imagecopy( $copy, $im, 0, 0, 0, 0, 1200, 630 );
		$txt = imagecreatetruecolor( strlen( $label ) * 9, 15 );
		imagealphablending( $txt, false );
		imagesavealpha( $txt, true );
		imagefill( $txt, 0, 0, imagecolorallocatealpha( $txt, 0, 0, 0, 127 ) );
		imagestring( $txt, 5, 0, 0, $label, imagecolorallocate( $txt, 20, 20, 20 ) );
		imagealphablending( $copy, true );
		imagecopyresampled( $copy, $txt, 600 - strlen( $label ) * 27, 270, 0, 0, strlen( $label ) * 54, 90, strlen( $label ) * 9, 15 );
		$name = $out . '/' . $ext . ( $transparent ? '-transparent' : '' ) . '.' . $ext;
		match ( $ext ) {
			'jpg'  => imagejpeg( $copy, $name, 85 ),
			'png'  => imagepng( $copy, $name ),
			'webp' => imagewebp( $copy, $name, 85 ),
			'avif' => imageavif( $copy, $name, 60 ),
		};
		echo basename( $name ) . ' ' . filesize( $name ) . "\n";
	}
}
