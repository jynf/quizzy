import { useEffect, useState } from 'react'

function Workspace() {
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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
        if (!Array.isArray(data.questions)) {
          throw new Error('The response does not contain a questions array.')
        }

        setQuestions(data.questions)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message)
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

  return (
    <section>
      <h1>Workspace</h1>
      <p>This page fetches sample data from a local JSON endpoint.</p>
      {loading && <p className="message">Loading questions...</p>}
      {error && (
        <p className="message error" role="alert">
          Could not load questions: {error}
        </p>
      )}
      {!loading && !error && (
        <>
          <p className="message" role="status">
            Fetch worked: loaded {questions.length} questions.
          </p>
          <div className="question-list">
            {questions.map((question) => (
              <article className="question" key={question.id}>
                <h2>{question.category}</h2>
                <p>{question.prompt}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Workspace
