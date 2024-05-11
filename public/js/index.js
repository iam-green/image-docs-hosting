const getFile = () => {
    let file = document.getElementById('file').files[0];

    let file_name = document.getElementById('file-name');
    file_name.removeAttribute('hidden');
    file_name.innerText=`이름 : ${file.name}`;

    if(file.type.split('/')[0]==='image') {
        let image_preview = document.getElementById('image-preview');
        let reader = new FileReader();
        image_preview.removeAttribute('hidden');
        reader.onload = (e) => {
            image_preview.setAttribute('src',String(e.target.result));
        }
        reader.readAsDataURL(file);
    } else {
        document.getElementById('image-preview').setAttribute('hidden','enabled');
    }
}
