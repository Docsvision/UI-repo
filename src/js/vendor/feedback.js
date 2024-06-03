var config = (document.getElementById('site-script') || { dataset: {} }).dataset
var uiRootPath = (config.uiRootPath == null ? window.uiRootPath : config.uiRootPath) || '.'

// Переменные для хранения значений полей ввода
let selectedText = ''
let errorDescription = ''
let suggestionText = ''
let contactEmail = ''

// Константы для строковых значений
const ICON_MSG = `<img src="${uiRootPath}/img/message.svg" alt="icon" class="msg-icon-xs">`
const ICON_CLOSE = `<img src="${uiRootPath}/img/close.svg" alt="icon" class="msg-icon-xs">`

const DISPLAY_FLEX = 'flex'
const DISPLAY_NONE = 'none'

// Получение элемента по ID
const getElementById = (id) => document.getElementById(id)

// Получение всех элементов по селектору
const querySelectorAll = (selector) => document.querySelectorAll(selector)

// Функция переключения видимости основного меню
function toggleMainMenu () {
  const feedbackButton = getElementById('feedback-button')
  const feedbackMainMenu = getElementById('feedback-main-menu')
  const feedbackModals = querySelectorAll('.feedback-modal')

  const anyModalOpen = [...feedbackModals].some((modal) => modal.style.display === DISPLAY_FLEX)
  if (anyModalOpen) {
    clearInputs()
    closeAllModals()
    feedbackButton.innerHTML = ICON_MSG
  } else {
    feedbackMainMenu.style.display = DISPLAY_FLEX
    feedbackMainMenu.setAttribute('aria-hidden', 'false')
    feedbackButton.innerHTML = ICON_CLOSE

    // Сохранение выделенного текста
    selectedText = window.getSelection().toString()
    if (selectedText) {
      getElementById('error-text').value = selectedText
    }
  }
}

// Функция обработки нажатия кнопки "Назад"
function handleBackButtonClick () {
  const feedbackMainMenu = getElementById('feedback-main-menu')
  closeAllModals()
  feedbackMainMenu.style.display = DISPLAY_FLEX
  feedbackMainMenu.setAttribute('aria-hidden', 'false')
}

// Функция обработки нажатия кнопки "Отправить"
function handleSubmitButtonClick (event) {
  event.preventDefault()
  const feedbackType = this.closest('.feedback-modal').id
  if (feedbackType === 'feedback-confirm' && !validateEmail()) {
    return
  }
  sendFeedback(feedbackType)
}

// Функция обработки нажатия кнопки "Далее"
function handleNextButtonClick () {
  if (getElementById('suggestion-text')) {
    suggestionText = getElementById('suggestion-text').value
  }

  const feedbackSuggestionModal = getElementById('feedback-suggestion')
  const feedbackConfirmModal = getElementById('feedback-confirm')

  feedbackSuggestionModal.style.display = DISPLAY_NONE
  feedbackSuggestionModal.setAttribute('aria-hidden', 'true')
  feedbackConfirmModal.style.display = DISPLAY_FLEX
  feedbackConfirmModal.setAttribute('aria-hidden', 'false')
}

// Функция обработки нажатия клавиши Ctrl + Enter
function handleKeyDown (event) {
  if (event.ctrlKey && event.key === 'Enter') {
    selectedText = window.getSelection().toString()
    if (selectedText) {
      closeAllModals()
      getElementById('error-text').value = selectedText
      getElementById('feedback-error').style.display = DISPLAY_FLEX
      getElementById('feedback-error').setAttribute('aria-hidden', 'false')
      getElementById('feedback-button').innerHTML = ICON_CLOSE
    }
  }
}

// Функция обработки нажатия на вариант обратной связи
function handleOptionClick () {
  const feedbackType = this.getAttribute('data-feedback')
  closeAllModals()
  if (feedbackType === 'error') {
    getElementById('error-text').value = selectedText || ''
    getElementById('error-description').value = errorDescription || ''
    getElementById('feedback-error').style.display = DISPLAY_FLEX
    getElementById('feedback-error').setAttribute('aria-hidden', 'false')
  } else if (feedbackType === 'suggestion') {
    getElementById('suggestion-text').value = suggestionText || ''
    getElementById('feedback-suggestion').style.display = DISPLAY_FLEX
    getElementById('feedback-suggestion').setAttribute('aria-hidden', 'false')
  }
}

// Функция проверки валидности email
function validateEmail () {
  const contactEmailInput = getElementById('contact-email')
  const emailError = getElementById('email-error')

  if (!contactEmailInput.checkValidity()) {
    emailError.textContent = 'Email введён некорректно'
    return false
  } else {
    emailError.textContent = ''
    return true
  }
}

// Функция очистки всех полей ввода
function clearInputs () {
  selectedText = ''
  errorDescription = ''
  suggestionText = ''
  contactEmail = ''
  getElementById('error-text').value = ''
  getElementById('error-description').value = ''
  getElementById('suggestion-text').value = ''
  getElementById('contact-email').value = ''
  getElementById('email-error').textContent = ''
}

// Функция закрытия всех модальных окон
function closeAllModals () {
  querySelectorAll('.feedback-modal').forEach((modal) => {
    modal.style.display = DISPLAY_NONE
    modal.setAttribute('aria-hidden', 'true')
  })
}

// Функция отправки обратной связи на сервер
async function sendFeedback (feedbackType) {
  const title = feedbackType === 'feedback-error' ? 'Ошибка' : 'Предложение'
  let body = ''
  if (getElementById('error-description')) {
    errorDescription = getElementById('error-description').value
  }
  if (getElementById('contact-email')) {
    contactEmail = getElementById('contact-email').value
  }

  switch (feedbackType) {
    case 'feedback-error':
      body = `Выделенный текст: ${selectedText}\nОписание: ${errorDescription}\nURL: ${window.location.href}`
      break
    case 'feedback-confirm':
      body = `Предложение: ${suggestionText}\nКонтакт: ${contactEmail}`
      break
  }

  const repo = 'Docsvision/online-doc-issues'
  // const token = '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'

  if ((selectedText && errorDescription) || (contactEmail && suggestionText)) {
    try {
      await createGitHubIssue(title, body, repo, token)
      showSuccessMessage('Сообщение успешно отправлено!')
      clearInputs()
      closeAllModals()
      getElementById('feedback-button').innerHTML = ICON_MSG
    } catch (error) {
      alert('Ошибка при отправке сообщения.')
      console.error('Error:', error)
    }
  }
}
// Функция создания тикета в GitHub
async function createGitHubIssue (title, body, repo, token) {
  const url = `https://api.github.com/repos/${repo}/issues`

  const issueData = {
    title: title,
    body: body,
  }

  const options = {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(issueData),
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Ошибка при создании тикета: ${response.statusText}`)
  }
  return await response.json()
}

// Функция отображения сообщения об успешной отправке
function showSuccessMessage (message) {
  const successMessage = getElementById('success-message')
  successMessage.textContent = message
  successMessage.style.display = 'block'

  setTimeout(() => {
    successMessage.style.display = DISPLAY_NONE
  }, 3000)
}

document.addEventListener('DOMContentLoaded', () => {
  // Ссылки на элементы интерфейса
  const feedbackButton = document.getElementById('feedback-button')
  const feedbackBackButtons = document.querySelectorAll('.feedback-back')
  const feedbackSubmitButtons = document.querySelectorAll('.feedback-submit')
  const feedbackNextButtons = document.querySelectorAll('.feedback-next')
  const contactEmailInput = document.getElementById('contact-email')

  // Обработчики событий
  feedbackButton.addEventListener('click', toggleMainMenu)

  feedbackBackButtons.forEach((button) => {
    button.addEventListener('click', handleBackButtonClick)
  })

  feedbackSubmitButtons.forEach((button) => {
    button.addEventListener('click', handleSubmitButtonClick)
  })

  feedbackNextButtons.forEach((button) => {
    button.addEventListener('click', handleNextButtonClick)
  })

  document.addEventListener('keydown', handleKeyDown)

  document.querySelectorAll('.feedback-option').forEach((option) => {
    option.addEventListener('click', handleOptionClick)
  })
  contactEmailInput.addEventListener('input', validateEmail)
})
