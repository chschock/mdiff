# Introduction

I was missing a tool that is suitable to compare text data like a diff, but is able to recognize transpositions of text blocks. Imagine a text is shuffled in blocks - then the information about the difference can be described as a permutation of the blocks.

Applications of this involve seeing changes in complex XML data, changes in config files where order doesn't matter and refactoring of source code that involves shifting of blocks.

The computation is performed in client-side JavaScript. The page is static and no data is passed to a server.

# Use

Go to http://chschock.github.io/mdiff/ and upload two versions of a file you'd like to compare.

# Background

The mdiff program computes a distance matrix between both texts, that describes the length of matching substrings at every position (a very sparse matrix). The it solves the linear assignment problem on this distance matrix with an algorithm of cubic complexity, but adapted to the sparsity. If we assume len(text1)=len(text2)=n and m the approximate number of non-empty substrings at each position, the complexity should be around O(nm^2).

The optimization problem is known as Linear Assignment Problem and the solver is known as Kuhn-Munkres or Hungarian Algorithm. A very good description is available here: http://www.topcoder.com/community/data-science/data-science-tutorials/assignment-problem-and-hungarian-algorithm/

A golang port of the algorithm is available at git@github.com:chschock/gomdiff.git . It's designed as a webservice and can be accessed by the same frontend.
