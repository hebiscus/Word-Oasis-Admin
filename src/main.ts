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
})

function toogleUserBox() {
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
}

toogleUserBox();

const editor = new EditorJS("editorjs");

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
  const finalContentData = JSON.stringify(paragraphs);
  const title = document.getElementById("title") as HTMLInputElement | null;
  if (!title) return

  console.log(title.value, paragraphs)
  try {
    const attempt = await fetch(`https://word-oasis-api-production.up.railway.app/posts`, {
      method:'POST',
      body: JSON.stringify({
          title: title.value,
          content: finalContentData,
          status: "published",
          creationDate: new Date(),
      }),
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem("userToken")}`
       },
    })
    const response = await attempt.json();
    console.log(response)
  } catch(err) {
    console.log(err)
  }
})

const submitButton = document.getElementById("submitPost");
submitButton?.addEventListener("click", submitPostData);

