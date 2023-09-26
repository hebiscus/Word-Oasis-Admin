import { ParagraphInterface } from './interfaces';
import './styles/style.scss';
import EditorJS from '@editorjs/editorjs';

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
      loginForm.setAttribute("id", "login-form");
      const nameInput = document.createElement("input");
      const passwordInput = document.createElement("input");
      const submitButton = document.createElement("button");

      nameInput.setAttribute("type", "text");
      nameInput.setAttribute("placeholder", "Name:");
      passwordInput.setAttribute("type", "password");
      passwordInput.setAttribute("placeholder", "Password:");
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
    editor.blocks.clear();
    document.getElementById("make-form").reset();
  } catch(err) {
    console.log(err)
  }
});

const updatePost = (async(e: MouseEvent, postId: string, title: string, updateEditor, status: boolean) => {
  e.preventDefault();

  console.log(updateEditor)

  const getContendData = () => {
    const contentData = updateEditor.save().then((outputData) => {
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
  const currentDate = new Date().toISOString();

  const urlEncoded = new URLSearchParams();
  urlEncoded.append("title", title);
  urlEncoded.append("status", "published");
  urlEncoded.append("creationDate", currentDate);
  paragraphs.forEach((paragraph: string) => {
    urlEncoded.append("content", paragraph)
  })

  try {
    const attempt = await fetch(`https://word-oasis-api-production.up.railway.app/posts/${postId}/update`, {
      method:'PUT',
      body: urlEncoded,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem("userToken")}`
       },
    })
    const response = await attempt.json();
    console.log(response)
    
    updateEditor.blocks.clear();
    // const IDinput = document.getElementById("id-input") as HTMLInputElement;
    // const titleInput = document.getElementById("update-title") as HTMLInputElement;
    // titleInput!.value = "";
    // IDinput!.value = "";
    document.getElementById("update-id").reset();
    document.getElementById("update-form").reset();
  } catch(err) {
    console.log(err)
  }
})

function createUpdateForm(foundPost, updateEditor) {
  const updateBox = document.getElementById("update-box");
  const updateForm = document.createElement("form");
  updateForm.setAttribute("id", "update-form");
  
  const titleInput = document.createElement("input");
  titleInput.setAttribute("type", "text");
  titleInput.setAttribute("id", "update-title");
  titleInput.value = foundPost.title;

  const statusLabel = document.createElement("label")
  statusLabel.setAttribute("for", "statusInput");
  statusLabel.innerText = "published?"
  const updateStatus = document.createElement("input");
  updateStatus.setAttribute("type", "checkbox");
  updateStatus.setAttribute("id", "statusInput");

  const updateSubmit = document.createElement("button")
  updateSubmit.setAttribute("type", "submit");
  updateSubmit.addEventListener("click", (e: MouseEvent) => updatePost(e, foundPost._id, titleInput.value, updateEditor, updateStatus.checked))
  updateSubmit.innerText = "Update Post"

  updateForm.append(titleInput, statusLabel, updateStatus, updateSubmit);
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
    const foundResponse = await foundPostResponse.json();
    console.log(foundResponse);
    const foundPost = foundResponse.blogpost
    console.log(foundPost.content)

    const dataMap = foundPost.content.map((paragraph: string) => {
      return {type: "paragraph", data: {"text": paragraph}}
    })
    console.log(dataMap)
    
    const updateEditor = new EditorJS({
      holder: "updateEditor",
      data: {"blocks" : dataMap},
    })

    createUpdateForm(foundPost, updateEditor);
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
