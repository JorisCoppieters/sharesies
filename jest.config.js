module.exports = {
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    testRegex: '.test.ts$',
    testPathIgnorePatterns: ['test/'],
    moduleFileExtensions: ['ts', 'js'],
};
