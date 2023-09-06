import { ParagraphInterface } from './interfaces';
import './styles/style.scss';
import EditorJS from '@editorjs/editorjs';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    I'm innocent I swear!
  </div>
`

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
  // const finalContentData = JSON.stringify(paragraphs);
  const title = document.getElementById("title") as HTMLInputElement | null;
  if (!title) return
  
  try {
    await fetch(`https://word-oasis-api-production.up.railway.app/posts`, {
      method:'POST',
      body: JSON.stringify({
          author: title.value,
          content: paragraphs,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
  } catch(err) {
    console.log(err)
  }
})

const submitButton = document.getElementById("submitPost");
submitButton?.addEventListener("click", submitPostData);

