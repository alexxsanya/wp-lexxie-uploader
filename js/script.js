(function($) {
    $(document).ready(function() {
        var $formNotice = $('.form-notice');
        var $imgForm    = $('.image-form');
        var $imgNotice  = $imgForm.find('.image-notice');
        var $imgPreview = $imgForm.find('.image-preview');
        var $imgFile    = $imgForm.find('.image-file');
        var $imgId      = $imgForm.find('[name="image_id"]');

        $imgFile.on('change', function(e) {
            e.preventDefault();
        
            var formData = new FormData();
        
            formData.append('action', 'upload-attachment');
            formData.append('async-upload', $imgFile[0].files[0]);
            formData.append('name', $imgFile[0].files[0].name);
            formData.append('_wpnonce', sa_config.nonce);

            //validating image file before uploading it
            ImagefileValidation($imgFile[0]);

            $.ajax({
                url: sa_config.upload_url,
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
                type: 'POST',
                beforeSend: () => {
                    $imgFile.hide();
                    $imgNotice.html('Uploading&hellip;').show();
                },
                success: (resp) => {
                    if ( resp.success ) {
                        $imgNotice.html(`
                        Successfully uploaded.  <a href="#" class="btn-change-image">Change?</>`);
                
                        var img = $('<img>', {
                            src: resp.data.url
                        });
                
                        $imgId.val( resp.data.id );
                        $imgPreview.html( img ).show();
                
                    } else {
                        $imgNotice.html('Fail to upload image. Please try again.');
                        $imgFile.show();
                        $imgId.val('');
                    }
                },
                xhr: () => {
                    var myXhr = $.ajaxSettings.xhr();
                
                    if ( myXhr.upload ) {
                        myXhr.upload.addEventListener( 'progress', (e) => {
                            if ( e.lengthComputable ) {
                                var perc = ( e.loaded / e.total ) * 100;
                                perc = perc.toFixed(2);
                                $imgNotice.html('Uploading&hellip;(' + perc + '%)');
                            }
                        }, false );
                    }
                
                    return myXhr;
                }
            });
        });

        $imgForm.on( 'click', '.btn-change-image', function(e) {
            e.preventDefault();
            $imgNotice.empty().hide();
            $imgFile.val('').show();
            $imgId.val('');
            $imgPreview.empty().hide();
        });
        
        $imgFile.on('click', function() {
            $(this).val('');
            $imgId.val('');
        });

        $imgForm.on('submit', function(e) {
            e.preventDefault();
        
            var data = $(this).serialize();
        
            $.post( sa_config.ajax_url, data, function(resp) {
                if ( resp.success ) {
                    $formNotice.css('color', 'green');
                    $imgForm[0].reset();
                    $imgNotice.empty().hide();
                    $imgPreview.empty().hide();
                    $imgId.val('');
                    $imgFile.val('').show();
                } else {
                    $formNotice.css('color', 'red');
                }
        
                $formNotice.html( resp.data.msg );
            });
        });


    });
})(jQuery);


const ImagefileValidation = (file) => {
        
    /*
        Implemented this method based on 
        https://stackoverflow.com/questions/18299806/how-to-check-file-mime-type-with-javascript-before-upload
        File signature ref -> https://en.wikipedia.org/wiki/List_of_file_signatures
    */

    messages = {
        'size': 'Image file exceeds acceptable file size of 300Kb',
        'unknown': 'File selected is not a valid photo file'
    }

    //file => file[0]
    const fileSize = file.files[0].size;

    if ( fileSize > 3 * 1024 ){
        alert(messages['size'])
        return false;
    }

    if (window.FileReader && window.Blob) {
        // All the File APIs are supported.
        blob = file.files[0];
        // This validates that the image is of an acceptable file type
        getBLOBFileHeader(blob);
        
    } else {
        // File and Blob are not supported
        alert('Blob not supported')
    }
}

const mimeType =(headerString) => {
    switch (headerString) {
      case "89504e47":
        type = "image/png";
        break;
      case "47494638":
        type = "image/gif";
        break;
      case "ffd8ffe0":
      case "ffd8ffe1":
      case "ffd8ffe2":
        type = "image/jpeg";
        break;
      default:
        type = "unknown";
        break;
    }
    return type;
  }

// Return the first few bytes of the file as a hex string
const getBLOBFileHeader = (blob) =>  {
    var fileReader = new FileReader();
    fileReader.onloadend = function(e) {
      var arr = (new Uint8Array(e.target.result)).subarray(0, 4);
      var header = "";
      for (var i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
       //check the header against the acceptable headers
       type = mimeType(header)

       if (type == 'unknown') {
           alert(messages['unknown'])
           return false;
       }else {
           return true
       }
       
    };
    fileReader.readAsArrayBuffer(blob);
  }