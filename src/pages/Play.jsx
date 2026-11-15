import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const QUESTION_TIME = 20

function Play() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [selectedChoiceId, setSelectedChoiceId] = useState(null)
  const [status, setStatus] = useState('playing')

  useEffect(() => {
    const controller = new AbortController()

    async function loadQuestions() {
      try {
        const response = await fetch('/data/questions.json', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()

        const validQuestions =
          Array.isArray(data.questions) &&
          data.questions.every((question) =>
            question &&
            typeof question.id === 'string' &&
            typeof question.prompt === 'string' &&
            Array.isArray(question.choices) &&
            question.choices.length === 4 &&
            question.choices.every(
              (choice) =>
                typeof choice.id === 'string' &&
                typeof choice.text === 'string',
            ) &&
            question.choices.some(
              (choice) => choice.id === question.correctChoiceId,
            ),
          )

        if (!validQuestions) {
          throw new Error('Questions data is missing.')
        }

        setQuestions(data.questions)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'An unexpected error occurred.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadQuestions()
    return () => controller.abort()
  }, [])

  const question = questions[questionIndex]

  useEffect(() => {
    if (loading || error || !question || status !== 'playing') {
      return undefined
    }

    if (timeLeft === 0) {
      setStatus('timedOut')
      return undefined
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((remaining) => Math.max(remaining - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [loading, error, question, status, timeLeft])

  function chooseAnswer(choiceId) {
    if (status !== 'playing' || timeLeft === 0) {
      return
    }

    setSelectedChoiceId(choiceId)
    setStatus('answered')

    if (choiceId === question.correctChoiceId) {
      setScore((currentScore) => currentScore + 1)
    }
  }

  function goToNextQuestion() {
    setQuestionIndex((index) => index + 1)
    setSelectedChoiceId(null)
    setTimeLeft(QUESTION_TIME)
    setStatus('playing')
  }

  function restartGame() {
    setQuestionIndex(0)
    setScore(0)
    setSelectedChoiceId(null)
    setTimeLeft(QUESTION_TIME)
    setStatus('playing')
  }

  if (loading) {
    return <p className="message" role="status">Loading questions...</p>
  }

  if (error) {
    return (
      <section>
        <p className="message error" role="alert">
          Could not load questions: {error}
        </p>
        <Link to="/">Back Home</Link>
      </section>
    )
  }

  if (questions.length === 0) {
    return <p>No questions are available yet.</p>
  }

  if (!question) {
    return (
      <section className="game">
        <h1>Game complete!</h1>
        <p>Your score: {score} / {questions.length}</p>
        <button type="button" onClick={restartGame}>Play Again</button>
        <Link to="/">Home</Link>
      </section>
    )
  }

  const canContinue = status === 'answered' || status === 'timedOut'
  const answeredCorrectly =
    status === 'answered' &&
    selectedChoiceId === question.correctChoiceId

  return (
    <section className="game">
      <h1>Question {questionIndex + 1} of {questions.length}</h1>
      <p className="timer" role="timer">Time left: {timeLeft}s</p>
      <h2>{question.prompt}</h2>

      <div className="choices">
        {question.choices.map((choice) => {
          const isCorrect = choice.id === question.correctChoiceId
          const isSelected = choice.id === selectedChoiceId
          const classNames = [
            'choice',
            canContinue && isCorrect ? 'correct' : '',
            isSelected && !isCorrect ? 'incorrect' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              className={classNames}
              type="button"
              key={choice.id}
              onClick={() => chooseAnswer(choice.id)}
              disabled={status !== 'playing'}
            >
              {choice.text}
            </button>
          )
        })}
      </div>

      {status === 'answered' && (
        <p role="status">
          {answeredCorrectly ? 'Correct!' : 'Not quite.'}
        </p>
      )}

      {status === 'timedOut' && (
        <p role="status">Time is up! The correct answer is highlighted.</p>
      )}

      {canContinue && (
        <button type="button" onClick={goToNextQuestion}>
          {questionIndex === questions.length - 1 ? 'See Results' : 'Next'}
        </button>
      )}

      <p>Score: {score}</p>
    </section>
  )
}

export default Play