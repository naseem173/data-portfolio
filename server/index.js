import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import stocksRouter from './routes/stocks.js'
import cricketRouter from './routes/cricket.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/stocks', stocksRouter)
app.use('/api/cricket', cricketRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
