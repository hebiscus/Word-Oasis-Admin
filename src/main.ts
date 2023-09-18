import { ParagraphInterface } from './interfaces';
import './styles/style.scss';
import EditorJS from '@editorjs/editorjs';


// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     I'm innocent I swear!
//   </div>
// `

const loginRequest = (async(e: MouseEvent, name: string, password: string) => {
    e.preventDefault();

    try {
      const login = await fetch(`https://word-oasis-api-production.up.railway.app/admin/log-in`, {
        method:'POST',
        body: JSON.stringify({
            name: name,
            password: password,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const loginData = await login.json();
      localStorage.setItem("userToken", loginData.token);
    } catch(err) {
      console.log(err);
    }
});

function showUserBox() {
    const userBox = document.getElementById("user-box");
    const userToken = localStorage.getItem("userToken");
    
    if (!userToken) {
      const loginForm = document.createElement("form");
      const nameInput = document.createElement("input");
      const passwordInput = document.createElement("input");
      const submitButton = document.createElement("button");

      nameInput.setAttribute("type", "text");
      passwordInput.setAttribute("type", "password");
      submitButton.setAttribute("type", "submit");
      submitButton.addEventListener("click", (e: MouseEvent) => loginRequest(e, nameInput.value, passwordInput.value));
      submitButton.innerText = "Login";

      loginForm.append(nameInput, passwordInput, passwordInput, submitButton);
      userBox?.append(loginForm);
    } else {
      const loggedInBox = document.createElement("div");
      loggedInBox.innerText = "You're logged in!";
      userBox?.append(loggedInBox);
    }
};

showUserBox();

const editor = new EditorJS({
  placeholder: "Start writing here...",
  holder: "editorjs",
});

const submitPostData = (async(e: MouseEvent) => {
  e.preventDefault();

  const getContendData = () => {
    const contentData = editor.save().then((outputData) => {
      console.log('Article data: ', outputData)
      return outputData;
    }).catch((error) => {
      console.log('Saving failed: ', error)
    });

    return contentData;
  }
  
  const data = await getContendData();
  const paragraphs = data.blocks.map((paragraph: ParagraphInterface) => {
      return paragraph.data.text
  })
  const title = document.getElementById("title") as HTMLInputElement | null;
  const fileInput = document.getElementById("blogpostImage") as HTMLInputElement | null;
  if (!title || !fileInput) return
  const currentDate = new Date().toISOString();

  const formData = new FormData();
  formData.append("title", title.value);
  formData.append("blogpostImage", fileInput.files![0]);
  formData.append("status", "published");
  formData.append("creationDate", currentDate);
  paragraphs.forEach((paragraph: string) => {
    formData.append("content[]", paragraph)
  })

  try {
    const attempt = await fetch(`http://localhost:3038/posts`, {
      method:'POST',
      body: formData,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem("userToken")}`
       },
    })
    const response = await attempt.json();
    console.log(response)
  } catch(err) {
    console.log(err)
  }
});

const updatePost = (async(e: MouseEvent, postId: string, title: string, content: string, status: boolean) => {
  e.preventDefault();

  try {
    const updatingRes = await fetch(`https://word-oasis-api-production.up.railway.app/posts/${postId}/update`, {
      method: "PUT",
      body: JSON.stringify({
        title: title,
        content: content,
        status: "published",
        creationDate: new Date(),
      }),
      headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${localStorage.getItem("userToken")}`
      },
    })
  } catch(err) {
    console.log(err);
  }
})

function createUpdateForm(postId: string, title: string, content: string) {
  const updateBox = document.getElementById("update-box")
  const updateForm = document.createElement("form");
  
  const titleInput = document.createElement("input");
  titleInput.setAttribute("type", "text");
  titleInput.value = title;

  const contentInput = document.createElement("textarea")
  contentInput.value = content;

  const statusLabel = document.createElement("label")
  statusLabel.setAttribute("for", "statusInput");
  statusLabel.innerText = "published?"
  const updateStatus = document.createElement("input");
  updateStatus.setAttribute("type", "checkbox");
  updateStatus.setAttribute("id", "statusInput");

  const updateSubmit = document.createElement("button")
  updateSubmit.setAttribute("type", "submit");
  updateSubmit.addEventListener("click", (e: MouseEvent) => updatePost(e, postId, titleInput.value, contentInput.value, updateStatus.checked))
  updateSubmit.innerText = "Update Post"

  updateForm.append(titleInput, contentInput, statusLabel, updateStatus, updateSubmit);
  updateBox?.append(updateForm)
}

async function showUpdatePost(e: MouseEvent) {
  e.preventDefault();

  const idInput = document.getElementById("id-input") as HTMLInputElement;

  if (!idInput.value) {
    console.log("temporary: huh, what post?")
  } else {
    const postId = idInput.value;
    const foundPostResponse = await fetch(`https://word-oasis-api-production.up.railway.app/posts/${postId}`);
    const foundPost = await foundPostResponse.json();
    console.log(foundPost);

    createUpdateForm(postId, foundPost.title, foundPost.content);
  }
}

async function deletePost(e: MouseEvent) {
  e.preventDefault();
  const postInput = document.getElementById("id-delete") as HTMLInputElement;
  if (!postInput.value) {
    console.log("temporary: heyyy, no ID?");
    return
  }
  const postId = postInput.value;

  try {
    await fetch(`https://word-oasis-api-production.up.railway.app/posts/${postId}/delete`, {
      method: "DELETE",
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem("userToken")}`
        },
    })
  } catch(err) {
    console.log(err);
  }
}

async function deleteComment(e: MouseEvent) {
  e.preventDefault();
  const commentInput = document.getElementById("comment-delete") as HTMLInputElement;
  if (!commentInput.value) {
    console.log("temporary: heyyy, no ID?");
    return
  }
  const commentId = commentInput.value;

  try {
    await fetch(`https://word-oasis-api-production.up.railway.app/posts/comments/${commentId}/delete`, {
      method: "DELETE",
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem("userToken")}`
        },
    })
  } catch(err) {
    console.log(err);
  }
}

const submitButton = document.getElementById("submitPost");
submitButton?.addEventListener("click", submitPostData);

const updateButton = document.getElementById("update-button");
updateButton?.addEventListener("click", showUpdatePost);

const deleteButton = document.getElementById("delete-button");
deleteButton?.addEventListener("click", deletePost);

const deleteCommentBtn = document.getElementById("comment-button");
deleteCommentBtn?.addEventListener("click", deleteComment);
