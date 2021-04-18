<div align="center">
<img src="./static/vostas.png" />
</div>
<hr/>

> will eventually implement clause learning based on CDCL

### Sat Solver based on DPLL

#### Example

##### `Input File`
```scheme
(or (not x1) x3 x4)
(or (not x2) x6 x4)
(or (not x2) (not x6) (not x3))
(or (not x4) (not x2))
(or x2 (not x3) (not x1))
(or x2 x6 x3)
(or x2 (not x6) (not x4))
(or x1 x5)
(or x1 x6)
(or (not x6) x3 (not x5))
(or x1 (not x3) (not x5))
```

##### `Output`
<img src="./static/out1.png" />
