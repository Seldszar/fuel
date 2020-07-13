# Fuel

> Interactive countdown using Twitch Channel Points

## Setup

1. Clone the repository or download the latest [release archive](https://github.com/seldszar/fuel/releases/latest)
2. Install Node.js dependencies (`npm install`)

## Usage

When running the program (`npm start`) for the first time, the program will generate a `data` folder and a `options.json` file, then follow the instructions displayed in the console.

A file named `data/files/time.txt` will be also generated displaying the countdown for an integration with your favorite brodcasting software.

## Options

| Key               | Type   | Description                                        |
|-------------------|--------|----------------------------------------------------|
| `accessToken`     | String | The access token                                   |
| `userId`          | String | The user ID for listening reward redemptions       |
| `maxTime`         | Number | The maximum time (in milliseconds)                 |
| `rewards`         | Object | the supported rewards                              |
| `rewards[].title` | String | The rewards title                                  |
| `rewards[].time`  | Number | The time to add to the countdown (in milliseconds) |

Example:

```json
{
	"accessToken": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	"userId": "23345149",
	"rewards": [
		{
			"title": "Une demie-heure d'essence",
			"time": 1800000
		}
	]
}
```

## Author

Alexandre Breteau - [@0xSeldszar](https://twitter.com/0xSeldszar)

## License

MIT © [Alexandre Breteau](https://seldszar.fr)
