//In ai.js
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);
async function ask(prompt) {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: ["\"\"\""],
    });
    const answer = response.data.choices[0].text;
    return answer;
}
//Export the "ask" function
module.exports = {
    ask,
};