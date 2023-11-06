const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) =>{
    res.send('Murn Inn Server is running');
})

app.listen(port, () =>{
    console.log(`Murn Inn server running port on: ${port}`);
})