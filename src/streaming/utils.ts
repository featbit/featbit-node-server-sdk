/********************** encode text begin *****************************/
const alphabet: Record<string, string> = {
  "0": "Q",
  "1": "B",
  "2": "W",
  "3": "S",
  "4": "P",
  "5": "H",
  "6": "D",
  "7": "X",
  "8": "Z",
  "9": "U",
}

function encodeNumber(param: number, length: number): string {
  var s = "000000000000" + param;
  const numberWithLeadingZeros = s.slice(s.length - length);
  return numberWithLeadingZeros.split('').map(n => alphabet[n]).join('');
}

// generate connection token
export function generateConnectionToken(text: string): string {
  text = text.replace(/=*$/, '');
  const timestamp = Date.now();
  const timestampCode = encodeNumber(timestamp, timestamp.toString().length);
  // get random number less than the length of the text as the start point, and it must be greater or equal to 2
  const start = Math.max(Math.floor(Math.random() * text.length), 2);

  return `${encodeNumber(start, 3)}${encodeNumber(timestampCode.length, 2)}${text.slice(0, start)}${timestampCode}${text.slice(start)}`;
}

/********************** encode text end *****************************/

export function getTimestampFromDateTimeString(dateTime: string): number {
  return new Date(dateTime).getTime();
}