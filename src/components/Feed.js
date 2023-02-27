import {
  auth, doc, getDoc, db,
} from '../firebase/firebase.js';
// eslint-disable-next-line import/no-cycle
import {
  addPost, getPost, observerUser, edPost, deletePost, darLike, quitarLike,
} from '../firebase/functions.js';

// FEED

export const Feed = () => {
  const FeedDiv = document.createElement('div');
  const sectionFeed = `
    <header>
      <div class='headerFeed'>
        <h1 class="title_feed">SabiOld</h1>
        <div class='btnOut'>
          <p class='textOut'>Salir</p>
          <img src='./IMG/salida-de-la-puerta.png' alt='Salir de SabiOld' id='imgOut'>
        </div>
      </div>
    </header>
    <hr>
    <section class='section_feed'>
      <section class='section_profile'>
        <div id='profile'>
          <label for='name' class='name_profile'>Tú sabes quien soy:</label>
          <textarea id='textProfile' class='textarea_profile' name='textarea' placeholder='Aquí el texto a publicar'></textarea>
          <p class='error' id='errorNoPost'></p>
          <div class='buttons_profile'>
            <button class='button btnPost' id='btnPost'>Publicar</button>
            <button class='button btnPost' id='btnCancelPost'>Cancelar</button>
          </div>
        </div>
      </section>
      <hr>
      <section class='section_posts' id='posts'></section>
    </section>
  `;
  FeedDiv.innerHTML = sectionFeed;
  return FeedDiv;
};

// GUARDAR POST

export const savePost = () => {
  const btnPostPublicar = document.getElementById('btnPost');
  btnPostPublicar.addEventListener('click', () => {
    const txtPost = document.getElementById('textProfile').value;
    const errorPost = document.getElementById('errorNoPost');
    if (txtPost !== '') {
      const callback = (txt, uid, nameU, dateP) => {
        addPost(txt, uid, nameU, dateP);
      };
      observerUser(callback, txtPost);
      document.getElementsByClassName('textarea_profile')[0].value = '';
    } else {
      errorPost.textContent = 'No has agregado texto a tu publicación';
    }
  });
  const btnPostCancelar = document.getElementById('btnCancelPost');
  btnPostCancelar.addEventListener('click', () => {
    const txtPost = document.getElementById('textProfile');
    txtPost.value = '';
  });
};

// MOSTRAR POST

export const showPost = () => {
  getPost()
    .then((postSnapshot) => {
      const sectionPosts = document.getElementById('posts');
      sectionPosts.innerHTML = '';
      const userLoginFirebase = auth.currentUser.uid;
      postSnapshot.docs.forEach((docu) => {
        const userPost = docu.data().userUid;
        if (userLoginFirebase === userPost) {
          const articlePost = `
            <article class='postUsers'>
              <div class='post' name='feed' id=${docu.id}>
                <label id='nameUserPost' for='name' class='name_user'>${docu.data().nameUser}</label>
                <button type='button' id=${'ed'}${docu.id} class='btn_edit'>
                  <img class='imgEdit' src='./IMG/boligrafo.png' alt='Lápiz de edición'>
                </button>
                <h4 id=${'h4'}${docu.id} class='textarea_post' name='textarea'>${docu.data().post}</h4>
                <div class='likear' id=${docu.id}>
                  <img class='imgLikeRosa' src='./IMG/corazonRosa.png' alt='Corazón pintado de rosa'>
                  <img class ='imgLikeVacio' src='./IMG/corazon.png' alt='Corazón sin pintar'></img>
                  <span class='contador' id=${'c'}${docu.id}>0</span>
                </div>
                <div class='container_remove'>
                  <!--<p class='textRemove'>Eliminar Publicación</p>-->
                  <button class='btn_remove' id=${'de'}${docu.id}>
                    <img class='imgRemove' src="./IMG/eliminar.png" alt="Eliminar publicación">
                  </button>
                </div>
              </div>
            </article>
          `;
          sectionPosts.innerHTML += articlePost;
        } else {
          const articlePost = `
          <article class='postUsers'>
            <div name='feed' id='post'>
              <label id='nameUserPost' for='name' class='name_user'>${docu.data().nameUser}</label>
              <h4 id='textPost' class='textarea_post' name='textarea'>${docu.data().post}</h4>
              <div class='likear' id=${docu.id}>
                <img class='imgLikeRosa' src='./IMG/corazonRosa.png' alt='Corazón pintado de rosa'>
                <img class ='imgLikeVacio' src='./IMG/corazon.png' alt='Corazón sin pintar'></img>
                <span class='contador'id=${'c'}${docu.id}>0</span>
              </div>
            </div>
          </article>
        `;
          sectionPosts.innerHTML += articlePost;
        }
      });

      // DELETE

      const btnRemove = sectionPosts.querySelectorAll('.btn_remove');
      btnRemove.forEach((btn) => {
        btn.addEventListener('click', () => {
          const confirmRemove = window.confirm('¿Realmente deseas borrar este post?');
          if (confirmRemove === true) {
            deletePost(btn.id)
              .then(() => { showPost(); });
          } else {
            console.log('no se borra nada');
          }
        });
      });

      // EDIT

      const btnEdit = sectionPosts.querySelectorAll('.btn_edit');
      const h4Text = sectionPosts.querySelectorAll('.textarea_post');
      btnEdit.forEach((btnE) => {
        h4Text.forEach((h4T) => {
          const idH4 = h4T.id;
          const idBtn = btnE.id;
          btnE.addEventListener('click', (e) => {
            if (idH4.slice(2) === idBtn.slice(2)) {
              // console.log(textToEdit);
              const textToEdit = h4T.innerHTML;
              let editPost = prompt('inserte nuevo texto', textToEdit);
              if (editPost === null) {
                editPost = textToEdit;
              }
              const idPost = e.target.parentElement.parentElement.id;
              console.log(editPost);
              edPost(idPost, editPost);
              showPost();
            }
          });
        });
      });

      // LIKE

      const likePost = sectionPosts.querySelectorAll('.likear');
      likePost.forEach((btnLike) => {
        btnLike.addEventListener('click', async () => {
          const userUidLike = auth.currentUser.uid;
          const docRef = doc(db, 'Posts', btnLike.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            if (docSnap.data().totalLikes.includes(userUidLike)) {
              quitarLike(userUidLike, btnLike.id)
                .then(() => {
                  const numero = document.getElementById(`${'c'}${btnLike.id}`);
                  numero.innerHTML = (docSnap.data().totalLikes.length) - 1;
                });
            } else {
              darLike(userUidLike, btnLike.id)
                .then(() => {
                  const numero = document.getElementById(`${'c'}${btnLike.id}`);
                  numero.innerHTML = (docSnap.data().totalLikes.length) + 1;
                });
            }
          } else {
            console.log('No such document!');
          }
        });
      });
    });
};
