<?php
// Usage: wp eval-file create.php <label> <image path>. Uploads the image and publishes a post with it as the
// featured image and in an Image block. Prints "<attachment id> <post slug>".
list( $label, $path ) = $args;
require_once ABSPATH . 'wp-admin/includes/image.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';

$tmp = wp_tempnam( $path );
copy( $path, $tmp );
$name = $label . '-' . basename( $path );
$id   = media_handle_sideload( array( 'name' => $name, 'tmp_name' => $tmp ), 0 );
if ( is_wp_error( $id ) ) {
	WP_CLI::error( $id->get_error_message() );
}

$src  = wp_get_attachment_image_src( $id, 'large' );
$post = wp_insert_post(
	array(
		'post_title'   => $name,
		'post_name'    => sanitize_title( $name ),
		'post_status'  => 'publish',
		'post_content' => '<!-- wp:paragraph --><p>Test post.</p><!-- /wp:paragraph --><!-- wp:image {"id":' . $id . ',"sizeSlug":"large"} --><figure class="wp-block-image size-large"><img src="' . esc_url( $src[0] ) . '" alt="" class="wp-image-' . $id . '"/></figure><!-- /wp:image -->',
	)
);
set_post_thumbnail( $post, $id );
echo $id . ' ' . get_post_field( 'post_name', $post ) . "\n";
