 // Wait for the DOM to load 
document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("typeBox");
  const mic = document.getElementById("mic");
  const imessage = document.getElementById("imessage");
  const messageEnd = document.querySelector(".messageEnd");

  textarea.addEventListener("input", () => {
    if (textarea.value.trim() === "") {
      console.log("empty");
    } else {
      // Replace the mic icon with a blue button
      if (mic.tagName === "IMG") {
        const sendButton = document.createElement("button");
        sendButton.textContent = "^";
        sendButton.style.backgroundColor = "#248cff";
        sendButton.style.color = "white";
        sendButton.style.borderRadius = "50px";
        sendButton.style.border = "none";
        sendButton.style.padding = "20px 25px";
        sendButton.style.cursor = "pointer";
        sendButton.style.position = "relative";
        sendButton.style.left = "875px";
        sendButton.style.bottom = "10px";

        mic.replaceWith(sendButton);

        // Add functionality to the button
        sendButton.addEventListener("click", () => {
          const newMsg = textarea.value.trim();
          if (newMsg) {
            // Create a new outgoing message
            const newDiv = document.createElement("div");
            newDiv.classList.add("outgoing");
            newDiv.textContent = newMsg;

            // Insert the new message before the messageEnd div
            imessage.insertBefore(newDiv, messageEnd);

            // Clear the textarea
            textarea.value = "";
          }
        });
      }
    }
  });
});