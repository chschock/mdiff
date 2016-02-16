#!/bin/python
import dlib
import datetime

textA = """  TextA TextB TextC TextD werden vertauscht"""
textB = """ TextB TextC TextA  werden vertauscht TextD"""
textA = " TextB TextC TextqqqqqqqqqqqqqqqA  werden vertauscht TextD" * 32
textB = "  TextA TextB     tC TextD werden vertauscht  qqqqqqqqqqqqqqqqqqq" * 32
textA = " Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque lectus eros, sodales in massa ac, cursus lorem. In eget risus vitae lacus ultricies ac non tellus.Maecenas mollis ipsum eget maximus laoreet. Maecenas faucibus suscipit quam et consectetur. Phasellus semper facilisis efficitur. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi sollicitudin sem tortor, a venenatis diam varius at. Sed accumsan, est in ultricies elementum, dolor sem pharetra eros, vitae iaculis nisl ipsum nec arcu. Aenean elementum odio lorem, nec semper magna venenatis sed. Proin gravida ex ut magna vestibulum iaculis. Mauris diam neque, dignissim a lorem id, vulputate ultricies urna. Suspendisse eget dictum magna. Mauris bibendum ullamcorper ipsum quis tincidunt. Aenean mollis vehicula purus, quis ornare orci pharetra vel. Sed id ipsum eleifend, condimentum velit quis, venenatis urna. Ut at ante in augue condimentum vehicula. Phasellus ullamcorper quis ex at suscipit. Sed tristique, ante eget tincidunt cursus, neque magna tempor nunc, non sodales augue nunc at leo. Suspendisse vestibulum faucibus quam, eu dignissim erat scelerisque et. Aliquam quis aliquam arcu, eget consequat orci. Donec ac ex non eros laoreet porttitor. Fusce eget libero eu ipsum bibendum vehicula vel sit amet eros. Aenean vehicula rutrum metus, eu mollis tellus fringilla eu. Proin tristique mauris ut nisi porttitor, vitae fringilla orci fringilla. Sed accumsan sapien turpis, aliquam venenatis velit molestie sit amet. Praesent tempor ante ut elit tempor, faucibus euismod arcu congue. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin faucibus lacus id pulvinar tempus. Mauris fermentum, erat ac malesuada interdum, neque leo vulputate felis, vel tincidunt mauris sapien eget enim. Ut tincidunt lectus ac placerat imperdiet. Aenean scelerisque varius elit a. Proin ornare vel tortor eget lobortis. Suspendisse et velit ut metus commodo placerat nec eu. Suspendisse sit amet sapien porttitor, cursus eros vel, accumsan risus. Etiam imperdiet libero at lobortis. Vivamus tristique eros egestas quam  porttitor. Proin venenatis nec urna a ultrices. In luctus, nisi tempus consectetur, sapien lacus ultricies justo, a sodales magna dui et. Curabitur sit amet lectus feugiat arcu. Sed ac egestas nibh, egestas dolor in, condimentum ipsum. Mauris ut elementum, consectetur varius urna. Duis vel arcu at orci fermentum rutrum. Suspendisse varius tincidunt lectus eu pulvinar. Fusce tristique non odio non tincidunt. Vestibulum a orci vel ipsum sagittis mollis tempor vitae massa. Donec sit amet vehicula augue, nec mattis mi. Nulla ut vulputate ante, vitae tempor est. In eu pellentesque dui. Donec pulvinar dolor at pellentesque convallis. Maecenas risus neque, vulputate eu ipsum quis, laoreet ornare velit. Ut nec dapibus ipsum, sed sagittis ipsum.Maecenas ac tempus nunc. In pretium diam in lectus volutpat, et faucibus neque tempus. Nullam lacinia bibendum leo sit amet ornare. Etiam tincidunt dui sit amet scelerisque tempor. Sed efficitur orci luctus blandit facilisis. Pellentesque sed bibendum neque. Nullam id lacus eros. Sed eu quam non nisl efficitur tincidunt ac eu tortor. Vivamus accumsan mauris eget velit semper tempor eu in nunc. Sed maximus eu nulla ut sodales. Curabitur metus odio, faucibus quis ullamcorper eu, cursus sit amet risus. ";
textB = " Lorem ipsum dolor sit amet,  adipiscing elit. Pellentesque  eros, sodales in massa ac, cursus elementum lorem. In risus vitae lacus rhoncus ultricies non tellus. Aenean scelerisque varius elit a tempus. ornare vel tortor eget lobortis. Suspendisse velit ut metus commodo placerat nec eu risus. Suspendisse sit amet sapien, cursus eros vel, accumsan risus. fringilla imperdiet libero at lobortis tristique eros egestas quam pellentesque porttitor. venenatis nec urna a ultrices. In luctus, nisi vitae  ultricies justo, a sodales magna tempus consectetur, sapien lacus dui et arcu. Sed ac egestas nibh. Curabitur sit amet lectus feugiat, egestas dolor in, condimentum ipsum. Mauris ut elementum magna varius urna. Duis vel arcu at orci fermentum rutrum. Suspendisse varius tincidunt lectus eu pulvinar. Fusce tristique non in nunc. Sed maximus eu nulla ut sodales. Curabitur metus odio, faucibus quis ullamcorper eu,  odio non tincidunt. Vestibulum a orci vel ipsum sagittis mollis tempor vitae massa. Donec sit amet vehicula augue, nec mattis mi. Nulla ut vulputate ante, vitae tempor est. In eu pellentesque dui. Donec pulvinar dolor at pellentesque convallis. Maecenas risus neque, vulputate eu ipsum quis, laoreet ornare velit. Ut nec dapibus ipsum, sed sagittis ipsum.Maecenas ac tempus nunc. In pretium diam in lectus volutpat, et faucibus neque tempus. Nullam lacinia bibendum leo sit amet ornare. Etiam tincidunt dui sit amet scelerisque tempor. Sed efficitur orci luctus blandit facilisis. Pellentesque sed bibendum neque. Nullam id lacus eros. Sed eu quam non nisl efficitur tincidunt ac eu tortor. Vivamus accumsan mauris eget velit semper tempor eu cursus sit amet risus. Maecenas mollis ipsum eget maximus laoreet. Maecenas faucibus suscipit quam et consectetur. Phasellus semper facilisis efficitur. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi sollicitudin sem tortor, a venenatis diam varius at. Sed accumsan, est in ultricies elementum, dolor sem pharetra eros, vitae iaculis nisl ipsum nec arcu. Aenean elementum odio lorem, nec semper magna venenatis sed. Proin gravida ex ut magna vestibulum iaculis. Mauris diam neque, dignissim a lorem id, vulputate ultricies urna. Suspendisse eget dictum magna. Mauris bibendum ullamcorper ipsum quis tincidunt. Aenean mollis vehicula purus, quis ornare orci pharetra vel. Sed id ipsum eleifend, condimentum velit quis, venenatis urna. Ut at ante in augue condimentum vehicula. Phasellus ullamcorper quis ex at suscipit. Sed tristique, ante eget tincidunt cursus, neque magna tempor nunc, non sodales augue nunc at leo. Suspendisse vestibulum faucibus quam, eu dignissim erat scelerisque et. Aliquam quis aliquam arcu, eget consequat orci. Donec ac ex non eros laoreet porttitor. Fusce eget libero eu ipsum bibendum vehicula vel sit amet eros. Aenean vehicula rutrum metus, eu mollis tellus fringilla eu. Proin tristique mauris ut nisi porttitor, vitae fringilla orci fringilla. Sed accumsan sapien turpis, aliquam venenatis velit molestie sit amet. Praesent tempor ante ut elit tempor, faucibus euismod arcu congue. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin faucibus lacus id pulvinar tempus. Mauris fermentum, erat ac malesuada interdum, neque leo vulputate felis, vel tincidunt mauris sapien eget enim. Ut tincidunt lectus ac placerat imperdiet.";
ruler = ':    .    ' * 5



def dist1(a, b):
    ret = -0.5
    i = 0
    # print(">{}< >{}<".format(a, b))
    while a[i] == b[i]:
        ret += 0.5 ** i
        i += 1
        if i >= min(len(a), len(b)):
            break
    return ret

def distM(a, b):
    if len(a) > len(b):
        c = a
        a = b
        b = c
    d = list()
    for i in range(len(a)):
        d.append(list())
        for j in range(len(b)):
            d[-1].append(int(10 * (
                dist1(a[i:], b[j:]) + dist1(a[i::-1], b[j::-1])
                )))
    return d

#print(distM(textA, textB))

#print(textA[0] == textB[1])

cost = dlib.matrix(distM(textA, textB))
print('cost matrix ready')
before = datetime.datetime.now()
assignment = dlib.max_cost_assignment(cost)
after = datetime.datetime.now()
print(textA)
print(textB)
print(ruler)

# This prints optimal assignments:  [2, 0, 1]
# which indicates that we should assign the person from the first row of the
# cost matrix to job 2, the middle row person to job 0, and the bottom row
# person to job 1.
print("Optimal assignments: {}".format(assignment))
print(after - before)