const closeButton = document.querySelector("#closeButton")
const windowTitle = document.querySelector("#windowTitle")
const messageBox = document.querySelector("#messageBox")

window.electronAPI.onInitTextContent((event, title, body)=>{
    windowTitle.textContent = title
    messageBox.textContent = body
})

closeButton.addEventListener("click", ()=>{
    window.electronAPI.closeDialog()
})