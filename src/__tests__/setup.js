// Sätt timeout för alla tester till 30 sekunder
jest.setTimeout(30000);

// Hantera ohanterade promise-rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 